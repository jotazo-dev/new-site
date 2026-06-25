import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ALLOWED_HOSTS = [
      "jotazo.com.br",
      "www.jotazo.com.br",
      "jotazo.lovable.app",
    ];
    const originHeader = req.headers.get("origin") || req.headers.get("referer") || "";
    let originHost = "";
    try { originHost = new URL(originHeader).hostname; } catch { /* ignore */ }
    const isLovablePreview = originHost.endsWith(".lovable.app") || originHost.endsWith(".lovableproject.com");
    if (!ALLOWED_HOSTS.includes(originHost) && !isLovablePreview) {
      return new Response(
        JSON.stringify({ error: "Forbidden origin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { event_name, event_id, event_source_url, user_data, custom_data } = body;

    if (!event_name || !event_id) {
      return new Response(
        JSON.stringify({ error: "event_name and event_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate event_source_url matches an allowed host to prevent attribution abuse
    if (event_source_url) {
      try {
        const srcHost = new URL(event_source_url).hostname;
        const srcAllowed = ALLOWED_HOSTS.includes(srcHost) || srcHost.endsWith(".lovable.app") || srcHost.endsWith(".lovableproject.com");
        if (!srcAllowed) {
          return new Response(
            JSON.stringify({ error: "Forbidden event_source_url" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid event_source_url" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Read settings from site_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["meta_pixel_id", "meta_capi_token", "meta_pixel_active"]);

    const settingsMap: Record<string, string> = {};
    for (const row of settings ?? []) {
      settingsMap[row.key] = row.value;
    }

    if (settingsMap["meta_pixel_active"] !== "true") {
      return new Response(
        JSON.stringify({ error: "Meta Pixel is not active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pixelId = settingsMap["meta_pixel_id"];
    const capiToken = settingsMap["meta_capi_token"];

    if (!pixelId || !capiToken) {
      return new Response(
        JSON.stringify({ error: "Pixel ID or CAPI token not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send event to Meta Conversions API
    const eventData: Record<string, unknown> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: "website",
    };

    if (event_source_url) {
      eventData.event_source_url = event_source_url;
    }

    if (user_data) {
      eventData.user_data = user_data;
    }

    if (custom_data) {
      eventData.custom_data = custom_data;
    }

    const fbResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [eventData],
          access_token: capiToken,
        }),
      }
    );

    const fbResult = await fbResponse.json();

    return new Response(JSON.stringify({ success: true, fb_response: fbResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
