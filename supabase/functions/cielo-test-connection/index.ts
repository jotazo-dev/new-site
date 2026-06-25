import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, message: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ ok: false, message: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await admin.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!roleData) return json({ ok: false, message: "Forbidden" }, 403);

    const { data: cfg, error: cfgErr } = await admin
      .from("cielo_config")
      .select("*")
      .maybeSingle();
    if (cfgErr) return json({ ok: false, message: cfgErr.message }, 500);
    if (!cfg) return json({ ok: false, message: "Configuração não encontrada. Salve antes de testar." });

    const isProd = cfg.environment === "production";
    const merchantId = isProd ? cfg.merchant_id_production : cfg.merchant_id_sandbox;
    const merchantKey = isProd ? cfg.merchant_key_production : cfg.merchant_key_sandbox;

    if (!merchantId || !merchantKey) {
      return json({ ok: false, message: `Credenciais ${isProd ? "produção" : "sandbox"} ausentes.` });
    }

    const baseUrl = isProd ? "https://api.braspag.com.br" : "https://apisandbox.braspag.com.br";
    const requestId = crypto.randomUUID();
    const merchantOrderId = `test-${Date.now()}`;

    // Zero Auth (validação de cartão sem efetivar)
    const payload = {
      MerchantOrderId: merchantOrderId,
      Customer: { Name: "Teste Conexao" },
      Payment: {
        Type: "CreditCard",
        Amount: 0,
        Provider: isProd ? cfg.provider_credit : "Simulado",
        Installments: 1,
        CreditCard: {
          CardNumber: "4024007197692931",
          Holder: "Teste",
          ExpirationDate: "12/2030",
          SecurityCode: "123",
          Brand: "Visa",
        },
      },
    };

    const started = Date.now();
    const res = await fetch(`${baseUrl}/v2/sales/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        MerchantId: merchantId,
        MerchantKey: merchantKey,
        RequestId: requestId,
      },
      body: JSON.stringify(payload),
    });
    const duration = Date.now() - started;
    const body = await res.json().catch(() => ({}));

    await admin.from("cielo_logs").insert({
      direction: "outbound",
      endpoint: "/v2/sales/ (test)",
      method: "POST",
      request_id: requestId,
      merchant_order_id: merchantOrderId,
      payment_id: body?.Payment?.PaymentId ?? null,
      status_code: res.status,
      request_body: { ...payload, Payment: { ...payload.Payment, CreditCard: "[masked]" } },
      response_body: body,
      duration_ms: duration,
    });

    if (res.status >= 200 && res.status < 300) {
      return json({
        ok: true,
        message: `Conexão OK (${cfg.environment}). Status Cielo: ${body?.Payment?.Status ?? "?"}`,
        details: body,
      });
    }

    return json({
      ok: false,
      message: `HTTP ${res.status}: ${body?.[0]?.Message ?? body?.Message ?? "Falha ao validar credenciais"}`,
      details: body,
    });
  } catch (e) {
    return json({ ok: false, message: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
