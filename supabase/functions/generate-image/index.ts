import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageRequest {
  generationId?: string; // Optional: if provided, update existing record instead of creating new
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
    const { generationId, prompt, aspectRatio, resolution, outputFormat, images, modelId, modelName, server, creditsToUse } = body;

    console.log("Generating image:", { generationId, modelId, modelName, server, prompt: prompt?.substring(0, 50) });

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
      // Update generation record to failed if it exists
      if (generationId) {
        await supabase
          .from('image_generations')
          .update({ status: 'failed', error_message: 'Insufficient credits' })
          .eq('id', generationId);
      }
      return new Response(
        JSON.stringify({ error: "Insufficient credits" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine provider based on server (match database values)
    const provider = server === 'server1' ? 'fal_ai' : 'gmicloud';

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
      // Update generation record to failed if it exists
      if (generationId) {
        await supabase
          .from('image_generations')
          .update({ status: 'failed', error_message: 'No available API key' })
          .eq('id', generationId);
      }
      return new Response(
        JSON.stringify({ error: "No available API key for this provider" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use existing generation record or create new one
    let recordId = generationId;
    
    if (!recordId) {
      // Create new record if not provided (backward compatibility)
      const { data: newRecord, error: insertError } = await supabase
        .from('image_generations')
        .insert({
          user_id: user.id,
          api_key_id: apiKeyData.id,
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
          output_format: outputFormat,
          model_id: modelId,
          model_name: modelName,
          server,
          status: 'pending',
          credits_used: creditsToUse,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create generation record:", insertError);
      } else {
        recordId = newRecord?.id;
      }
    } else {
      // Update existing record with api_key_id
      await supabase
        .from('image_generations')
        .update({ api_key_id: apiKeyData.id })
        .eq('id', generationId);
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
      
      // Update generation record with error
      if (recordId) {
        await supabase
          .from('image_generations')
          .update({ 
            status: 'failed', 
            error_message: generationError || 'Failed to generate image' 
          })
          .eq('id', recordId);
      }
      
      return new Response(
        JSON.stringify({ error: generationError || "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update generation record with success
    if (recordId) {
      await supabase
        .from('image_generations')
        .update({ 
          status: 'completed', 
          output_url: imageUrl 
        })
        .eq('id', recordId);
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
    let actualModelName = modelName;
    
    // For nano-banana-pro with images, use edit endpoint
    if (modelName === 'fal-ai/nano-banana-pro' && isImageToImage) {
      actualModelName = 'fal-ai/nano-banana-pro/edit';
    }
    
    // For Seedream 4.5 with images, use edit endpoint instead of text-to-image
    if (modelName === 'fal-ai/bytedance/seedream/v4.5/text-to-image' && isImageToImage) {
      actualModelName = 'fal-ai/bytedance/seedream/v4.5/edit';
    }
    
    const endpoint = `https://queue.fal.run/${actualModelName}`;

    // Build request body based on model
    const requestBody: any = {
      prompt,
    };

    // Seedream 4.5 uses image_size for aspect ratio (square_hd, portrait_4_3, etc.)
    const isSeedream = actualModelName.includes('bytedance/seedream');
    
    if (isSeedream) {
      // Seedream uses image_size field for aspect ratio values
      if (aspectRatio && aspectRatio !== 'auto') {
        requestBody.image_size = aspectRatio;
      }
    } else {
      // Other models use aspect_ratio
      if (aspectRatio && aspectRatio !== 'auto') {
        requestBody.aspect_ratio = aspectRatio;
      }
      
      // Add resolution/image_size for non-Seedream models
      if (resolution) {
        const resolutionMap: Record<string, string> = {
          '1K': '1024x1024',
          '2K': '2048x2048',
          '4K': '4096x4096',
        };
        requestBody.image_size = resolutionMap[resolution] || resolution;
      }
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
    
    // Use URLs from fal.ai response if available, otherwise construct manually
    const statusUrl = submitData.status_url || `https://queue.fal.run/${actualModelName}/requests/${requestId}/status`;
    const responseUrl = submitData.response_url || `https://queue.fal.run/${actualModelName}/requests/${requestId}`;

    console.log("Fal.ai submit response:", { requestId, statusUrl, responseUrl });

    if (!requestId) {
      console.error("No request_id in response:", submitData);
      return { error: "No request ID returned" };
    }

    // Poll for result using the status_url provided by fal.ai
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use the constructed URLs with actual model name
      const pollUrl = statusUrl;
      
      const statusResponse = await fetch(pollUrl, {
        method: "GET",
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
        // Response might already be included in status response
        if (statusData.response) {
          const imageUrl = statusData.response.images?.[0]?.url || statusData.response.image?.url;
          if (imageUrl) return { imageUrl };
        }
        
        // Otherwise fetch from response_url
        const resultUrl = responseUrl || `https://queue.fal.run/${modelName}/requests/${requestId}`;
        const resultResponse = await fetch(resultUrl, {
          method: "GET",
          headers: { "Authorization": `Key ${apiKey}` },
        });

        if (!resultResponse.ok) {
          console.error("Result fetch failed:", resultResponse.status);
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

// GMI Cloud generation (queue-based API like fal.ai)
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
    
    // GMI Cloud uses queue-based API
    const submitEndpoint = "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests";

    // Build payload based on model
    const payload: any = {
      prompt,
    };

    if (modelName === 'seedream-4-0-250828') {
      // Seedream 4 uses 'size' parameter
      if (aspectRatio) {
        payload.size = aspectRatio;
      }
      payload.watermark = false;
      payload.response_format = "url";
    } else {
      // Gemini 3 Pro Image Preview uses 'aspect_ratio' and 'image_size'
      if (aspectRatio && aspectRatio !== 'auto') {
        payload.aspect_ratio = aspectRatio;
      }
      if (resolution) {
        payload.image_size = resolution; // '1K', '2K', '4K'
      }
    }

    // Add images for image-to-image
    if (isImageToImage) {
      payload.image = images;
    }

    const requestBody = {
      model: modelName,
      payload,
    };

    console.log("GMI Cloud submit request:", { model: modelName, prompt: prompt.substring(0, 50) });

    // Submit request to queue
    const submitResponse = await fetch(submitEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error("GMI Cloud submit error:", submitResponse.status, errorText);
      return { error: `GMI Cloud submit error: ${submitResponse.status} - ${errorText}` };
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.id || submitData.request_id;

    if (!requestId) {
      console.error("No request ID in GMI response:", submitData);
      return { error: "No request ID in GMI response" };
    }

    console.log("GMI Cloud submit response:", { requestId });

    // Poll for result
    const pollEndpoint = `https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests/${requestId}`;
    const maxAttempts = 120; // 4 minutes max
    const pollInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(pollEndpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error("GMI Cloud poll error:", statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.status?.toLowerCase();

      console.log("GMI Cloud status:", status);

      if (status === 'completed' || status === 'succeeded' || status === 'success') {
        // Extract image URL from response
        const imageUrl = statusData.result?.images?.[0]?.url ||
                        statusData.result?.image_url ||
                        statusData.output?.images?.[0]?.url ||
                        statusData.output?.url ||
                        statusData.images?.[0]?.url ||
                        statusData.url;

        if (imageUrl) {
          return { imageUrl };
        }

        // Check for base64
        const b64 = statusData.result?.images?.[0]?.b64_json ||
                   statusData.output?.images?.[0]?.b64_json;
        if (b64) {
          return { imageUrl: `data:image/${outputFormat || 'png'};base64,${b64}` };
        }

        console.error("Completed but no image URL found:", statusData);
        return { error: "Completed but no image URL in response" };
      }

      if (status === 'failed' || status === 'error') {
        const errorMsg = statusData.error || statusData.message || "Generation failed";
        console.error("GMI Cloud generation failed:", errorMsg);
        return { error: errorMsg };
      }

      // Continue polling if pending/processing/in_progress
    }

    return { error: "GMI Cloud generation timed out" };
  } catch (error) {
    console.error("GMI Cloud error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
