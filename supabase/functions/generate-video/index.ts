import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  audioEnabled?: boolean;
  images?: string[]; // base64 encoded images
  modelId: string;
  server: 'server1' | 'server2';
}

// Map server to provider name in database
const serverToProvider: Record<string, string> = {
  server1: 'fal_ai',
  server2: 'gmicloud',
};

// Map resolution to fal.ai format
const resolutionMap: Record<string, string> = {
  '720p': '720p',
  '1080p': '1080p',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from token
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: VideoRequest = await req.json();
    const { prompt, negativePrompt, aspectRatio = '16:9', duration = 8, resolution = '1080p', audioEnabled = false, images = [], modelId, server } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!modelId || !server) {
      return new Response(
        JSON.stringify({ error: "Model ID and server are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-video] User: ${user.id}, Model: ${modelId}, Server: ${server}`);
    console.log(`[generate-video] Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`[generate-video] Options: duration=${duration}s, resolution=${resolution}, audio=${audioEnabled}, images=${images.length}`);

    // Get provider name for this server
    const provider = serverToProvider[server];
    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Invalid server" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get an active API key for this provider
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('id, api_key, credits')
      .eq('provider', provider)
      .eq('is_active', true)
      .gt('credits', 0)
      .order('credits', { ascending: false })
      .limit(1);

    if (apiKeyError || !apiKeys || apiKeys.length === 0) {
      console.error("No active API key found for provider:", provider, apiKeyError);
      return new Response(
        JSON.stringify({ error: `No active API key available for ${server}` }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKeyRecord = apiKeys[0];
    console.log(`[generate-video] Using API key: ${apiKeyRecord.id} with ${apiKeyRecord.credits} credits`);

    // Determine generation type
    const generationType = images.length === 0 ? 'text-to-video' : 
                          images.length === 1 ? 'image-to-video' : 'first-last-frame';
    
    console.log(`[generate-video] Generation type: ${generationType}`);

    let result;
    
    if (server === 'server1') {
      // fal.ai API
      result = await generateWithFalAI({
        apiKey: apiKeyRecord.api_key,
        prompt,
        negativePrompt,
        aspectRatio,
        duration,
        resolution,
        audioEnabled,
        images,
        generationType,
      });
    } else {
      // GMI Cloud - to be implemented
      return new Response(
        JSON.stringify({ error: "Server 2 (GMI Cloud) not yet implemented" }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (result.error) {
      console.error("[generate-video] Generation error:", result.error);
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-video] Generation successful:", result.videoUrl);

    return new Response(
      JSON.stringify({ 
        videoUrl: result.videoUrl,
        generationType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-video] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface FalAIParams {
  apiKey: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  duration: number;
  resolution: string;
  audioEnabled: boolean;
  images: string[];
  generationType: 'text-to-video' | 'image-to-video' | 'first-last-frame';
}

async function generateWithFalAI(params: FalAIParams): Promise<{ videoUrl?: string; error?: string }> {
  const { apiKey, prompt, negativePrompt, aspectRatio, duration, resolution, audioEnabled, images, generationType } = params;

  // Determine the correct endpoint based on generation type
  let endpoint: string;
  switch (generationType) {
    case 'text-to-video':
      endpoint = 'https://queue.fal.run/fal-ai/veo3.1/fast';
      break;
    case 'image-to-video':
      endpoint = 'https://queue.fal.run/fal-ai/veo3.1/fast/image-to-video';
      break;
    case 'first-last-frame':
      endpoint = 'https://queue.fal.run/fal-ai/veo3.1/fast/first-last-frame-to-video';
      break;
  }

  console.log(`[fal.ai] Using endpoint: ${endpoint}`);

  // Build request body based on generation type
  const requestBody: Record<string, unknown> = {
    prompt,
    duration: `${duration}s`,
    resolution: resolution,
    generate_audio: audioEnabled,
  };

  // Add aspect ratio (use 'auto' for image modes if specified, otherwise use the ratio)
  if (aspectRatio !== 'auto') {
    requestBody.aspect_ratio = aspectRatio;
  }

  // Add negative prompt if provided
  if (negativePrompt) {
    requestBody.negative_prompt = negativePrompt;
  }

  // Add images based on generation type
  if (generationType === 'image-to-video' && images.length >= 1) {
    requestBody.image_url = images[0];
  } else if (generationType === 'first-last-frame' && images.length >= 2) {
    requestBody.first_frame_image = images[0];
    requestBody.last_frame_image = images[1];
  }

  console.log(`[fal.ai] Request body:`, JSON.stringify(requestBody, null, 2));

  try {
    // Submit the job
    const submitResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`[fal.ai] Submit error: ${submitResponse.status}`, errorText);
      return { error: `fal.ai API error: ${submitResponse.status} - ${errorText}` };
    }

    const submitData = await submitResponse.json();
    console.log(`[fal.ai] Job submitted:`, submitData);

    const requestId = submitData.request_id;
    if (!requestId) {
      return { error: "No request ID returned from fal.ai" };
    }

    // Poll for result
    const statusEndpoint = `${endpoint}/requests/${requestId}/status`;
    const resultEndpoint = `${endpoint}/requests/${requestId}`;

    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(statusEndpoint, {
        headers: {
          'Authorization': `Key ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`[fal.ai] Status check error:`, errorText);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[fal.ai] Status (attempt ${attempts + 1}):`, statusData.status);

      if (statusData.status === 'COMPLETED') {
        // Get the result
        const resultResponse = await fetch(resultEndpoint, {
          headers: {
            'Authorization': `Key ${apiKey}`,
          },
        });

        if (!resultResponse.ok) {
          const errorText = await resultResponse.text();
          return { error: `Failed to get result: ${errorText}` };
        }

        const resultData = await resultResponse.json();
        console.log(`[fal.ai] Result:`, JSON.stringify(resultData, null, 2));

        // Extract video URL from response
        const videoUrl = resultData.video?.url || resultData.output?.video?.url;
        if (!videoUrl) {
          return { error: "No video URL in response" };
        }

        return { videoUrl };
      } else if (statusData.status === 'FAILED') {
        return { error: statusData.error || "Generation failed" };
      }

      attempts++;
    }

    return { error: "Generation timed out" };

  } catch (error) {
    console.error(`[fal.ai] Error:`, error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
