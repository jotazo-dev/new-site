// Asaas API proxy — autentica admin, encaminha requisição p/ Asaas e loga
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const adminDb = createClient(SUPABASE_URL, SERVICE_KEY);

const SANDBOX_URL = "https://api-sandbox.asaas.com/v3";
const PROD_URL = "https://api.asaas.com/v3";

type AsaasConfig = {
  environment: "sandbox" | "production";
  sandbox_api_key: string | null;
  production_api_key: string | null;
};

async function getConfig(envOverride?: string): Promise<{ apiKey: string; baseUrl: string; environment: string } | null> {
  const { data } = await adminDb.from("asaas_config").select("*").limit(1).maybeSingle();
  if (!data) return null;
  const cfg = data as AsaasConfig;
  const env = (envOverride === "sandbox" || envOverride === "production") ? envOverride : cfg.environment;
  const apiKey = env === "production" ? cfg.production_api_key : cfg.sandbox_api_key;
  const baseUrl = env === "production" ? PROD_URL : SANDBOX_URL;
  if (!apiKey) return null;
  return { apiKey, baseUrl, environment: env };
}

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  try {
    const c = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data } = await c.auth.getUser();
    return data?.user?.id ?? null;
  } catch { return null; }
}

function sanitize(payload: any): any {
  if (!payload || typeof payload !== "object") return payload;
  const clone = JSON.parse(JSON.stringify(payload));
  if (clone.creditCard) {
    if (clone.creditCard.number) clone.creditCard.number = "****" + String(clone.creditCard.number).slice(-4);
    if (clone.creditCard.ccv) clone.creditCard.ccv = "***";
  }
  return clone;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const guard = await requireAdmin(req);
  if (guard) return guard;

  const userId = await getUserId(req);
  const started = Date.now();
  let bodyJson: any = null;
  let envName = "sandbox";
  let endpoint = "";
  let method = "GET";

  try {
    bodyJson = await req.json();
    const { path, method: m = "GET", body, environment: envOverride } = bodyJson || {};
    if (!path || typeof path !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "path é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    method = String(m).toUpperCase();
    endpoint = path.startsWith("/") ? path : `/${path}`;

    const cfg = await getConfig(envOverride);
    if (!cfg) {
      return new Response(JSON.stringify({ ok: false, error: "Asaas não configurado (faltando API key)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    envName = cfg.environment;

    const url = `${cfg.baseUrl}${endpoint}`;
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "lovable-asaas-integration",
        "access_token": cfg.apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    };
    if (body !== undefined && body !== null && method !== "GET" && method !== "DELETE") {
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const res = await fetch(url, init);
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    const duration = Date.now() - started;

    await adminDb.from("asaas_logs").insert({
      environment: envName,
      endpoint,
      method,
      status_code: res.status,
      request_payload: sanitize(body ?? null),
      response_payload: data,
      error_message: res.ok ? null : (data?.errors?.[0]?.description || `HTTP ${res.status}`),
      duration_ms: duration,
      created_by: userId,
    });

    return new Response(JSON.stringify({ ok: res.ok, status: res.status, data, environment: envName, durationMs: duration }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const duration = Date.now() - started;
    const msg = (e as Error).message || String(e);
    await adminDb.from("asaas_logs").insert({
      environment: envName,
      endpoint: endpoint || "(unknown)",
      method,
      status_code: null,
      request_payload: sanitize(bodyJson?.body ?? null),
      response_payload: null,
      error_message: msg,
      duration_ms: duration,
      created_by: userId,
    });
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
