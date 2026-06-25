// Template Deno Edge Function — Mercado Pago
// Cobre: create-payment (cartão/pix/boleto) e webhook com validação x-signature.
// Copie para supabase/functions/mp-create-payment/index.ts e supabase/functions/mercadopago-webhook/index.ts.
// Em supabase/config.toml adicione: [functions.mercadopago-webhook]  verify_jwt = false

// =====================================================================
// supabase/functions/mp-create-payment/index.ts
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MP_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json();
  const { method, orderId, amount, payer, card, dueDays } = body;
  // method: 'credit' | 'pix' | 'boleto'

  const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`;

  let payload: Record<string, unknown> = {
    transaction_amount: Number(amount),
    description: `Pedido ${orderId}`,
    external_reference: orderId,
    notification_url: notificationUrl,
    statement_descriptor: "JOTAZO",
    metadata: { order_id: orderId },
    payer: {
      email: payer.email,
      first_name: payer.first_name,
      last_name: payer.last_name,
      identification: { type: payer.doc.length === 14 ? "CNPJ" : "CPF", number: payer.doc },
    },
  };

  if (method === "credit") {
    payload = { ...payload,
      token: card.token,
      installments: card.installments ?? 1,
      payment_method_id: card.payment_method_id,
      issuer_id: card.issuer_id,
      capture: true,
      binary_mode: false,
      three_d_secure_mode: "optional",
    };
  } else if (method === "pix") {
    payload = { ...payload,
      payment_method_id: "pix",
      date_of_expiration: isoFromNow((Number(body.qrTtlMinutes) || 30) * 60),
    };
  } else if (method === "boleto") {
    payload = { ...payload,
      payment_method_id: "bolbradesco",
      date_of_expiration: isoFromNow((Number(dueDays) || 3) * 86400),
      payer: { ...payload.payer as object, address: payer.address },
    };
  } else {
    return json({ error: "method inválido" }, 400);
  }

  const idem = crypto.randomUUID();
  const r = await fetch(`${MP_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idem,
    },
    body: JSON.stringify(payload),
  });
  const resp = await r.json();
  // Persistir resp.id, resp.status, status_detail, point_of_interaction, transaction_details, etc.
  await admin.from("checkout_orders").update({
    mp_payment_id: resp.id,
    mp_status: resp.status,
    mp_status_detail: resp.status_detail,
    pix_qr_string: resp?.point_of_interaction?.transaction_data?.qr_code ?? null,
    pix_qr_code: resp?.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
    pix_ticket_url: resp?.point_of_interaction?.transaction_data?.ticket_url ?? null,
    boleto_url: resp?.transaction_details?.external_resource_url ?? null,
    boleto_bar_code: resp?.barcode?.content ?? null,
    raw_response: resp,
  }).eq("id", orderId);

  return json({ ok: r.ok, status: resp.status, paymentId: resp.id, raw: resp }, r.status);
});

function isoFromNow(seconds: number) {
  const d = new Date(Date.now() + seconds * 1000);
  // formato com offset -03:00 (BR)
  return d.toISOString().replace("Z", "-03:00");
}
function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// =====================================================================
// supabase/functions/mercadopago-webhook/index.ts  (verify_jwt = false)
// =====================================================================
/*
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const SECRET = Deno.env.get("MP_WEBHOOK_SECRET")!;
  const ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const sigHeader = req.headers.get("x-signature") || "";
  const reqId = req.headers.get("x-request-id") || "";
  const raw = await req.text();
  const body = JSON.parse(raw || "{}");

  const parts = Object.fromEntries(sigHeader.split(",").map(s => s.trim().split("=")));
  const ts = parts.ts;
  const v1 = parts.v1;
  const dataId = body?.data?.id;
  const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const macBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(macBuf)).map(b => b.toString(16).padStart(2,"0")).join("");
  if (!timingSafeEqual(expected, v1)) return new Response("invalid signature", { status: 401 });

  // sempre buscar dados autoritativos
  if (body.type === "payment" && dataId) {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    const p = await r.json();
    const orderId = p.external_reference;
    const internal = mapStatus(p.status, p.status_detail);
    await admin.from("checkout_orders").update({
      mp_status: p.status, mp_status_detail: p.status_detail, status: internal,
      paid_at: internal === "paid" ? new Date().toISOString() : null,
      raw_response: p,
    }).eq("id", orderId);
    if (internal === "paid") {
      await admin.rpc("mark_order_paid", { _order_id: orderId, _payload: p });
    }
  }
  return new Response("ok");
});

function mapStatus(s: string, d: string) {
  if (s === "approved" || s === "authorized" && d === "accredited") return "paid";
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
*/
