// Receptor de webhooks Asaas — valida token, salva e responde 200 rápido
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const adminDb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const token = req.headers.get("asaas-access-token") || "";

    const { data: cfg } = await adminDb
      .from("asaas_config")
      .select("sandbox_webhook_token, production_webhook_token, environment")
      .limit(1)
      .maybeSingle();

    const allowed = [cfg?.sandbox_webhook_token, cfg?.production_webhook_token].filter(Boolean) as string[];
    if (allowed.length === 0 || !allowed.includes(token)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid webhook token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const eventId: string | undefined = payload?.id;
    const eventType: string = payload?.event || "UNKNOWN";
    const objectId: string | null = payload?.payment?.id || payload?.subscription?.id || payload?.transfer?.id || null;
    const matchedEnv = token === cfg?.production_webhook_token ? "production" : "sandbox";

    if (!eventId) {
      // sem id, ainda assim guardamos com id gerado
      await adminDb.from("asaas_webhooks").insert({
        event_id: `local-${crypto.randomUUID()}`,
        event_type: eventType,
        object_id: objectId,
        environment: matchedEnv,
        payload,
        received_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Idempotência: tenta inserir; se já existe, ignora
    const { error } = await adminDb.from("asaas_webhooks").insert({
      event_id: eventId,
      event_type: eventType,
      object_id: objectId,
      environment: matchedEnv,
      payload,
      received_at: new Date().toISOString(),
    });
    // 23505 = unique_violation → já recebido
    if (error && (error as any).code !== "23505") {
      console.error("asaas-webhook insert error", error);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("asaas-webhook error", e);
    // sempre 200 para evitar reentregas infinitas em erro nosso
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
