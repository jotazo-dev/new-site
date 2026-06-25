// deno-lint-ignore-file no-explicit-any
// Painel de testes: cria payment (pix/boleto/credit/preference) usando credenciais configuradas.
// SEMPRE retorna request_body + response_body + status_code + curl equivalente.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MP_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: claims.claims.sub, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const kind: "pix" | "boleto" | "preference" | "get_payment" | "refund" = body.kind;
    const envOverride = body?.environment as "sandbox" | "production" | undefined;

    const { data: cfg } = await admin.from("mp_config").select("*").limit(1).maybeSingle();
    if (!cfg) return json({ error: "Config não encontrada" }, 404);
    const env = envOverride || cfg.environment;
    const token = env === "production" ? cfg.access_token_production : cfg.access_token_sandbox;
    if (!token) return json({ error: `Access Token (${env}) não configurado` }, 400);

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const notification_url = `${supaUrl}/functions/v1/mercadopago-webhook`;
    const amount = Number(body.amount) || 1.0;
    const payerEmail = body.payer_email || "test_user_123@testuser.com";
    const payerDoc = (body.payer_doc || "12345678909").replace(/\D/g, "");
    const idem = crypto.randomUUID();
    const external_reference = body.external_reference || `test_${Date.now()}`;

    let endpoint = "";
    let method: "GET" | "POST" = "POST";
    let payload: any = null;
    let extraHeaders: Record<string, string> = {};

    if (kind === "pix") {
      endpoint = `${MP_BASE}/v1/payments`;
      extraHeaders["X-Idempotency-Key"] = idem;
      payload = {
        transaction_amount: amount,
        description: body.description || "Teste Pix Jotazo",
        payment_method_id: "pix",
        external_reference,
        notification_url,
        date_of_expiration: isoFromNow((cfg.pix_expiration_minutes ?? 30) * 60),
        payer: {
          email: payerEmail,
          first_name: body.first_name || "Teste",
          last_name: body.last_name || "Jotazo",
          identification: { type: payerDoc.length === 14 ? "CNPJ" : "CPF", number: payerDoc },
        },
      };
    } else if (kind === "boleto") {
      endpoint = `${MP_BASE}/v1/payments`;
      extraHeaders["X-Idempotency-Key"] = idem;
      payload = {
        transaction_amount: amount,
        description: body.description || "Teste Boleto Jotazo",
        payment_method_id: "bolbradesco",
        external_reference,
        notification_url,
        date_of_expiration: isoFromNow((cfg.boleto_due_days ?? 3) * 86400),
        payer: {
          email: payerEmail,
          first_name: body.first_name || "Teste",
          last_name: body.last_name || "Jotazo",
          identification: { type: payerDoc.length === 14 ? "CNPJ" : "CPF", number: payerDoc },
          address: body.address || {
            zip_code: "01310100", street_name: "Av Paulista", street_number: "1000",
            neighborhood: "Bela Vista", city: "São Paulo", federal_unit: "SP",
          },
        },
      };
    } else if (kind === "preference") {
      endpoint = `${MP_BASE}/checkout/preferences`;
      extraHeaders["X-Idempotency-Key"] = idem;
      payload = {
        items: [{
          id: "test-sku", title: body.description || "Teste Jotazo",
          quantity: 1, unit_price: amount, currency_id: cfg.currency_id || "BRL",
          category_id: "services",
        }],
        payer: { email: payerEmail },
        back_urls: {
          success: body.back_url || `${supaUrl.replace("/functions/v1", "")}/checkout/sucesso`,
          failure: body.back_url || `${supaUrl.replace("/functions/v1", "")}/checkout/erro`,
          pending: body.back_url || `${supaUrl.replace("/functions/v1", "")}/checkout/pendente`,
        },
        auto_return: "approved",
        notification_url,
        statement_descriptor: cfg.default_statement_descriptor || "JOTAZO",
        external_reference,
        metadata: { order_id: external_reference },
        binary_mode: cfg.binary_mode || false,
        payment_methods: { installments: cfg.max_installments || 12 },
      };
    } else if (kind === "get_payment") {
      if (!body.payment_id) return json({ error: "payment_id obrigatório" }, 400);
      endpoint = `${MP_BASE}/v1/payments/${body.payment_id}`;
      method = "GET";
    } else if (kind === "refund") {
      if (!body.payment_id) return json({ error: "payment_id obrigatório" }, 400);
      endpoint = `${MP_BASE}/v1/payments/${body.payment_id}/refunds`;
      extraHeaders["X-Idempotency-Key"] = idem;
      payload = body.amount ? { amount: Number(body.amount) } : {};
    } else {
      return json({ error: "kind inválido (pix|boleto|preference|get_payment|refund)" }, 400);
    }

    const started = Date.now();
    const r = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const duration = Date.now() - started;
    const text = await r.text();
    let response: any = null;
    try { response = text ? JSON.parse(text) : null; } catch { response = text; }

    await admin.from("mp_logs").insert({
      direction: "outbound",
      endpoint: endpoint.replace(MP_BASE, ""),
      method,
      request_id: r.headers.get("x-request-id"),
      idempotency_key: extraHeaders["X-Idempotency-Key"] || null,
      external_reference,
      payment_id: response?.id ? String(response.id) : null,
      status_code: r.status,
      request_body: payload,
      response_body: response,
      duration_ms: duration,
      error: r.ok ? null : (response?.message || `HTTP ${r.status}`),
    });

    const curl = buildCurl(method, endpoint, extraHeaders, payload, env);

    return json({
      ok: r.ok,
      environment: env,
      status_code: r.status,
      duration_ms: duration,
      endpoint: endpoint.replace(MP_BASE, ""),
      idempotency_key: extraHeaders["X-Idempotency-Key"] || null,
      request_body: payload,
      response_body: response,
      curl,
    }, r.ok ? 200 : 200);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});

function isoFromNow(seconds: number) {
  const d = new Date(Date.now() + seconds * 1000);
  // ISO com offset -03:00
  const iso = new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString();
  return iso.replace("Z", "-03:00");
}

function buildCurl(method: string, url: string, headers: Record<string, string>, body: any, env: string) {
  const hdrs = [
    `-H "Authorization: Bearer <ACCESS_TOKEN_${env.toUpperCase()}>"`,
    `-H "Content-Type: application/json"`,
    ...Object.entries(headers).map(([k, v]) => `-H "${k}: ${v}"`),
  ].join(" \\\n  ");
  return `curl -X ${method} '${url}' \\\n  ${hdrs}${body ? ` \\\n  -d '${JSON.stringify(body)}'` : ""}`;
}

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
