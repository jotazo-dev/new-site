// Send a test event to an endpoint (admin only).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supa = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await supa.auth.getClaims(token);
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { endpointId, event, sampleData } = await req.json();
    if (!endpointId || !event) {
      return new Response(JSON.stringify({ error: "endpointId and event required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: endpoint } = await admin
      .from("webhook_endpoints").select("*").eq("id", endpointId).single();
    if (!endpoint) {
      return new Response(JSON.stringify({ error: "endpoint not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enqueue test delivery (will be picked by runner)
    const envelope = {
      id: "evt_test_" + crypto.randomUUID().replace(/-/g, ""),
      event,
      created_at: new Date().toISOString(),
      api_version: "2026-06-21",
      test: true,
      data: sampleData ?? { example: true, message: "Teste manual da aba Automação" },
    };

    const { data: delivery, error } = await admin.from("webhook_deliveries").insert({
      endpoint_id: endpointId,
      event,
      payload: envelope,
      status: "pending",
      next_attempt_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    // Trigger runner immediately (fire-and-forget)
    fetch(`${SUPABASE_URL}/functions/v1/webhook-runner`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, deliveryId: delivery.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
