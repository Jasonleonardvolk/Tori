import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client with environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface TelemetryEvent {
  deviceId: string;
  model: string;
  os: string;
  sessionLenS: number;
  peakRamMb: number;
  avgFps: number;
  export: {
    success: boolean;
    durationMs: number;
    error?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Parse the request body
    const batch = await req.json() as TelemetryEvent[];
    
    // Validate the batch
    if (!Array.isArray(batch) || batch.length === 0) {
      return new Response("Invalid batch format", { status: 400 });
    }

    // Apply exponential backoff jitter to batch processing
    // This helps avoid thundering herd if endpoint goes down temporarily
    const jitterDelayMs = Math.floor(Math.random() * 200); // Random delay up to 200ms
    if (jitterDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, jitterDelayMs));
    }
    
    // Insert each telemetry event into the database
    const { error } = await supabase.from("telemetry").insert(
      batch.map(event => ({ payload: event }))
    );
    
    if (error) {
      console.error("Error inserting telemetry:", error);
      return new Response(error.message, { status: 500 });
    }
    
    return new Response("OK", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain",
      },
    });
  } catch (err) {
    console.error("Error processing telemetry:", err);
    return new Response(err.message || "Internal server error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
