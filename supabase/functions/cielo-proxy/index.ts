import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await admin.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!roleData) return json({ error: "Forbidden" }, 403);

    const { method, path, body, useQueryHost } = await req.json();
    if (!method || !path) return json({ error: "method e path obrigatórios" }, 400);

    const { data: cfg } = await admin.from("cielo_config").select("*").maybeSingle();
    if (!cfg) return json({ error: "Configuração não encontrada" }, 400);

    const isProd = cfg.environment === "production";
    const merchantId = isProd ? cfg.merchant_id_production : cfg.merchant_id_sandbox;
    const merchantKey = isProd ? cfg.merchant_key_production : cfg.merchant_key_sandbox;
    if (!merchantId || !merchantKey) return json({ error: "Credenciais ausentes" }, 400);

    const txHost = isProd ? "https://api.braspag.com.br" : "https://apisandbox.braspag.com.br";
    const qHost = isProd ? "https://apiquery.braspag.com.br" : "https://apiquerysandbox.braspag.com.br";
    const baseUrl = useQueryHost ? qHost : txHost;

    const requestId = crypto.randomUUID();
    const started = Date.now();

    const res = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        MerchantId: merchantId,
        MerchantKey: merchantKey,
        RequestId: requestId,
      },
      body: body && method !== "GET" ? JSON.stringify(body) : undefined,
    });
    const duration = Date.now() - started;
    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }

    await admin.from("cielo_logs").insert({
      direction: "outbound",
      endpoint: path,
      method,
      request_id: requestId,
      merchant_order_id: (body as any)?.MerchantOrderId ?? null,
      payment_id: (parsed as any)?.Payment?.PaymentId ?? null,
      status_code: res.status,
      request_body: maskSensitive(body),
      response_body: parsed,
      duration_ms: duration,
    });

    return json({ status: res.status, body: parsed }, 200);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function maskSensitive(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const cloned = JSON.parse(JSON.stringify(body));
  if (cloned?.Payment?.CreditCard) {
    cloned.Payment.CreditCard = { ...cloned.Payment.CreditCard, CardNumber: "[masked]", SecurityCode: "[masked]" };
  }
  if (cloned?.Payment?.DebitCard) {
    cloned.Payment.DebitCard = { ...cloned.Payment.DebitCard, CardNumber: "[masked]", SecurityCode: "[masked]" };
  }
  return cloned;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
