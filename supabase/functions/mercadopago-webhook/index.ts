// deno-lint-ignore-file no-explicit-any
// Webhook Mercado Pago: valida x-signature HMAC-SHA256, salva em mp_webhooks,
// busca dado autoritativo em /v1/payments/{id} e atualiza checkout_orders se houver external_reference.

import { createClient } from "npm:@supabase/supabase-js@2";

const MP_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (req.method === "GET") {
    // healthcheck
    return new Response(JSON.stringify({ ok: true, service: "mercadopago-webhook" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  if (req.method !== "POST") return new Response("ok");

  const raw = await req.text();
  let body: any = {};
  try { body = JSON.parse(raw || "{}"); } catch { /* ignore */ }

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

  const { data: cfg } = await admin.from("mp_config").select("*").limit(1).maybeSingle();
  const secret = cfg?.webhook_secret || "";
  const sigHeader = headers["x-signature"] || "";
  const reqId = headers["x-request-id"] || "";
  const dataId = body?.data?.id ? String(body.data.id) : "";

  let signatureValid = false;
  if (secret && sigHeader && dataId) {
    try {
      const parts = Object.fromEntries(sigHeader.split(",").map((s) => s.trim().split("=")));
      const ts = parts.ts; const v1 = parts.v1;
      const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const macBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
      const expected = Array.from(new Uint8Array(macBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      signatureValid = timingSafeEqual(expected, v1 || "");
    } catch { signatureValid = false; }
  }

  const { data: hookRow } = await admin.from("mp_webhooks").insert({
    topic: body?.type || body?.topic || null,
    action: body?.action || null,
    data_id: dataId || null,
    live_mode: body?.live_mode ?? null,
    signature_valid: signatureValid,
    raw_headers: headers,
    raw_body: body,
    processed: false,
  }).select().single();

  // Sempre responde 200 rápido — processamento abaixo é best-effort.
  const respond = () => new Response("ok", { status: 200 });

  // Se não temos secret configurada, aceitamos mesmo assim mas marcamos signature_valid=false.
  if (!signatureValid && secret) {
    await admin.from("mp_webhooks").update({ process_error: "invalid signature" }).eq("id", hookRow!.id);
    return new Response("invalid signature", { status: 401 });
  }

  // Buscar payment autoritativo
  try {
    if (body?.type === "payment" && dataId) {
      const env = cfg?.environment === "production" ? "production" : "sandbox";
      const token = env === "production" ? cfg?.access_token_production : cfg?.access_token_sandbox;
      if (token) {
        const r = await fetch(`${MP_BASE}/v1/payments/${dataId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const p = await r.json();
        await admin.from("mp_logs").insert({
          direction: "inbound",
          endpoint: `/v1/payments/${dataId} (webhook)`,
          method: "GET",
          status_code: r.status,
          response_body: p,
          payment_id: String(dataId),
          external_reference: p?.external_reference || null,
        });
        if (p?.external_reference) {
          const internal = mapStatus(p.status, p.status_detail);
          await admin.from("checkout_orders").update({
            raw_response: p,
            ...(internal === "paid" ? { status: "paid", paid_at: new Date().toISOString() } : {}),
            ...(internal === "refunded" ? { status: "refunded" } : {}),
            ...(internal === "failed" ? { status: "failed", last_error: { mp_status: p.status, detail: p.status_detail } } : {}),
          }).eq("id", p.external_reference);

          if (internal === "paid") {
            try { await admin.rpc("mark_order_paid", { _order_id: p.external_reference, _payload: p }); } catch { /* ignore */ }
          }
        }
      }
    }
    await admin.from("mp_webhooks").update({ processed: true }).eq("id", hookRow!.id);
  } catch (e) {
    await admin.from("mp_webhooks").update({ process_error: (e as Error).message }).eq("id", hookRow!.id);
  }

  return respond();
});

function mapStatus(s: string | null | undefined, _d: string | null | undefined): string {
  if (s === "approved") return "paid";
  if (s === "authorized") return "authorized";
  if (s === "refunded") return "refunded";
  if (s === "charged_back") return "chargeback";
  if (s === "rejected" || s === "cancelled") return "failed";
  return "pending";
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
