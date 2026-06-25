// Webhook delivery runner — pulls pending deliveries and POSTs them with HMAC signature.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const BACKOFF_SECONDS = [30, 120, 600, 3600, 21600, 86400]; // 30s, 2m, 10m, 1h, 6h, 24h
const BATCH_SIZE = 25;

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function deliverOne(delivery: any, endpoint: any): Promise<void> {
  const attemptNumber = (delivery.attempts ?? 0) + 1;
  const body = JSON.stringify({ ...delivery.payload, delivery_attempt: attemptNumber });
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = await hmacSha256Hex(endpoint.secret, `${ts}.${body}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Jotazo-Webhooks/1.0",
    "X-Webhook-Id": delivery.id,
    "X-Webhook-Event": delivery.event,
    "X-Webhook-Timestamp": ts,
    "X-Webhook-Signature": `sha256=${signature}`,
    ...(endpoint.headers ?? {}),
  };

  const started = Date.now();
  let status = 0;
  let responseText = "";
  let errorMsg: string | null = null;

  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), endpoint.timeout_ms ?? 10000);
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers,
      body,
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    status = res.status;
    responseText = (await res.text()).slice(0, 4000);
  } catch (e) {
    errorMsg = (e as Error).message ?? String(e);
  }

  const duration = Date.now() - started;
  const success = status >= 200 && status < 300;

  if (success) {
    await admin.from("webhook_deliveries").update({
      status: "success",
      attempts: attemptNumber,
      last_status_code: status,
      last_response: responseText,
      last_error: null,
      duration_ms: duration,
    }).eq("id", delivery.id);
    return;
  }

  const maxRetries = endpoint.max_retries ?? 5;
  const isDead = attemptNumber >= maxRetries;
  const backoff = BACKOFF_SECONDS[Math.min(attemptNumber - 1, BACKOFF_SECONDS.length - 1)];
  const nextAt = new Date(Date.now() + backoff * 1000).toISOString();

  await admin.from("webhook_deliveries").update({
    status: isDead ? "dead" : "failed",
    attempts: attemptNumber,
    last_status_code: status || null,
    last_response: responseText || null,
    last_error: errorMsg,
    duration_ms: duration,
    next_attempt_at: isDead ? new Date().toISOString() : nextAt,
  }).eq("id", delivery.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Pick batch
    const { data: pending } = await admin
      .from("webhook_deliveries")
      .select("*, endpoint:webhook_endpoints(*)")
      .in("status", ["pending", "failed"])
      .lte("next_attempt_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark in_progress
    const ids = pending.map((d: any) => d.id);
    await admin.from("webhook_deliveries").update({ status: "in_progress" }).in("id", ids);

    let ok = 0, fail = 0;
    for (const d of pending) {
      if (!d.endpoint || !d.endpoint.active) {
        await admin.from("webhook_deliveries").update({
          status: "dead",
          last_error: "endpoint inactive or missing",
        }).eq("id", d.id);
        continue;
      }
      try {
        await deliverOne(d, d.endpoint);
        ok++;
      } catch (e) {
        fail++;
        console.error("[runner] delivery threw", d.id, e);
      }
    }

    return new Response(JSON.stringify({ processed: pending.length, ok, fail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[runner] error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
