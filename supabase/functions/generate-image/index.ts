import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageRequest {
  prompt: string;
  aspectRatio?: string;
  resolution?: string;
  outputFormat?: string;
  images?: string[];
  modelId: string;
  modelName: string;
  server: 'server1' | 'server2';
  creditsToUse: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ImageRequest = await req.json();
    const { prompt, aspectRatio, resolution, outputFormat, images, modelId, modelName, server, creditsToUse } = body;

    console.log("Generating image:", { modelId, modelName, server, prompt: prompt?.substring(0, 50) });

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !userCredits || userCredits.balance < creditsToUse) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine provider based on server
    const provider = server === 'server1' ? 'fal.ai' : 'gmi-cloud';

    // Get active API key for the provider
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('provider', provider)
      .eq('is_active', true)
      .gt('credits', creditsToUse)
      .order('credits', { ascending: false })
      .limit(1)
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error("API key error:", apiKeyError);
      return new Response(
        JSON.stringify({ error: "No available API key for this provider" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let imageUrl: string | undefined;
    let generationError: string | undefined;

    // Generate based on server
    if (server === 'server1') {
      const result = await generateWithFalAI({
        apiKey: apiKeyData.api_key,
        modelName,
        prompt,
        aspectRatio: aspectRatio || '1:1',
        resolution: resolution || '1K',
        outputFormat: outputFormat || 'png',
        images: images || [],
      });
      imageUrl = result.imageUrl;
      generationError = result.error;
    } else {
      const result = await generateWithGMICloud({
        apiKey: apiKeyData.api_key,
        modelName,
        prompt,
        aspectRatio: aspectRatio || '1:1',
        resolution: resolution || '1K',
        outputFormat: outputFormat || 'png',
        images: images || [],
      });
      imageUrl = result.imageUrl;
      generationError = result.error;
    }

    if (generationError || !imageUrl) {
      console.error("Generation failed:", generationError);
      return new Response(
        JSON.stringify({ error: generationError || "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credits from user
    await supabase
      .from('user_credits')
      .update({ balance: userCredits.balance - creditsToUse })
      .eq('user_id', user.id);

    // Deduct credits from API key
    await supabase
      .from('api_keys')
      .update({ credits: apiKeyData.credits - creditsToUse })
      .eq('id', apiKeyData.id);

    // Record credit transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        api_key_id: apiKeyData.id,
        amount: -creditsToUse,
        transaction_type: 'image_generation',
        description: `Image generation: ${modelName}`,
      });

    console.log("Image generated successfully");

    return new Response(
      JSON.stringify({ imageUrl, creditsUsed: creditsToUse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fal.ai generation
interface FalAIParams {
  apiKey: string;
  modelName: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  outputFormat: string;
  images: string[];
}

async function generateWithFalAI(params: FalAIParams): Promise<{ imageUrl?: string; error?: string }> {
  const { apiKey, modelName, prompt, aspectRatio, resolution, outputFormat, images } = params;
  
  try {
    // Determine if image-to-image
    const isImageToImage = images.length > 0;
    
    // Build endpoint based on model and mode
    let endpoint = `https://queue.fal.run/${modelName}`;
    
    // For nano-banana-pro with images, use edit endpoint
    if (modelName === 'fal-ai/nano-banana-pro' && isImageToImage) {
      endpoint = 'https://queue.fal.run/fal-ai/nano-banana-pro/edit';
    }

    // Build request body based on model
    const requestBody: any = {
      prompt,
      aspect_ratio: aspectRatio === 'auto' ? undefined : aspectRatio,
    };

    // Add resolution/image_size
    if (resolution) {
      const resolutionMap: Record<string, string> = {
        '1K': '1024x1024',
        '2K': '2048x2048',
        '4K': '4096x4096',
      };
      requestBody.image_size = resolutionMap[resolution] || resolution;
    }

    // Add output format
    if (outputFormat) {
      requestBody.output_format = outputFormat;
    }

    // Add images for image-to-image
    if (isImageToImage) {
      requestBody.image_urls = images;
    }

    console.log("Fal.ai request:", { endpoint, prompt: prompt.substring(0, 50) });

    // Submit job
    const submitResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error("Fal.ai submit error:", submitResponse.status, errorText);
      return { error: `Fal.ai error: ${submitResponse.status}` };
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    if (!requestId) {
      console.error("No request_id in response:", submitData);
      return { error: "No request ID returned" };
    }

    // Poll for result
    const statusEndpoint = `https://queue.fal.run/${modelName}/requests/${requestId}/status`;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(statusEndpoint, {
        headers: { "Authorization": `Key ${apiKey}` },
      });

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log("Fal.ai status:", statusData.status);

      if (statusData.status === "COMPLETED") {
        // Get result
        const resultEndpoint = `https://queue.fal.run/${modelName}/requests/${requestId}`;
        const resultResponse = await fetch(resultEndpoint, {
          headers: { "Authorization": `Key ${apiKey}` },
        });

        if (!resultResponse.ok) {
          return { error: "Failed to get result" };
        }

        const resultData = await resultResponse.json();
        const imageUrl = resultData.images?.[0]?.url || resultData.image?.url;

        if (!imageUrl) {
          console.error("No image URL in result:", resultData);
          return { error: "No image URL in response" };
        }

        return { imageUrl };
      }

      if (statusData.status === "FAILED") {
        return { error: statusData.error || "Generation failed" };
      }

      attempts++;
    }

    return { error: "Generation timeout" };
  } catch (error) {
    console.error("Fal.ai error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// GMI Cloud generation
interface GMICloudParams {
  apiKey: string;
  modelName: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  outputFormat: string;
  images: string[];
}

async function generateWithGMICloud(params: GMICloudParams): Promise<{ imageUrl?: string; error?: string }> {
  const { apiKey, modelName, prompt, aspectRatio, resolution, outputFormat, images } = params;
  
  try {
    const isImageToImage = images.length > 0;
    
    // GMI Cloud endpoint
    const endpoint = "https://api.gmicloud.ai/v1/images/generations";

    // Build request body
    const requestBody: any = {
      model: modelName,
      prompt,
    };

    // Add aspect ratio or size
    if (modelName === 'seedream-4-0-250828') {
      // Seedream 4 uses specific size format
      requestBody.size = aspectRatio;
    } else {
      // Nano Banana Pro uses aspect_ratio
      if (aspectRatio && aspectRatio !== 'auto') {
        requestBody.aspect_ratio = aspectRatio;
      }
      
      // Add resolution
      if (resolution) {
        const resolutionMap: Record<string, string> = {
          '1K': '1024x1024',
          '2K': '2048x2048',
          '4K': '4096x4096',
        };
        requestBody.size = resolutionMap[resolution] || resolution;
      }
    }

    // Add output format
    if (outputFormat) {
      requestBody.response_format = outputFormat;
    }

    // Add images for image-to-image
    if (isImageToImage) {
      requestBody.images = images;
    }

    console.log("GMI Cloud request:", { model: modelName, prompt: prompt.substring(0, 50) });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GMI Cloud error:", response.status, errorText);
      return { error: `GMI Cloud error: ${response.status}` };
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

    if (!imageUrl) {
      console.error("No image URL in GMI response:", data);
      return { error: "No image URL in response" };
    }

    // If b64_json, convert to data URL
    if (data.data?.[0]?.b64_json) {
      return { imageUrl: `data:image/${outputFormat || 'png'};base64,${data.data[0].b64_json}` };
    }

    return { imageUrl };
  } catch (error) {
    console.error("GMI Cloud error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
