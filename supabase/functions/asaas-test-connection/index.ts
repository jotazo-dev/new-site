// Testa conexão com Asaas chamando /myAccount
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SANDBOX_URL = "https://api-sandbox.asaas.com/v3";
const PROD_URL = "https://api.asaas.com/v3";

const adminDb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { environment, apiKey: keyOverride } = await req.json();
    const env = environment === "production" ? "production" : "sandbox";
    let apiKey = keyOverride as string | undefined;
    if (!apiKey) {
      const { data } = await adminDb.from("asaas_config").select("sandbox_api_key, production_api_key").limit(1).maybeSingle();
      apiKey = env === "production" ? data?.production_api_key : data?.sandbox_api_key;
    }
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, message: "API Key não configurada para este ambiente." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const baseUrl = env === "production" ? PROD_URL : SANDBOX_URL;
    const res = await fetch(`${baseUrl}/myAccount`, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "lovable-asaas-integration",
        "access_token": apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return new Response(JSON.stringify({
        ok: false,
        status: res.status,
        message: data?.errors?.[0]?.description || `HTTP ${res.status}`,
        environment: env,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Busca saldo opcional
    let balance: number | null = null;
    try {
      const b = await fetch(`${baseUrl}/finance/balance`, {
        headers: { "access_token": apiKey, Accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      });
      if (b.ok) {
        const bd = await b.json();
        balance = bd?.balance ?? null;
      }
    } catch {}

    return new Response(JSON.stringify({
      ok: true,
      environment: env,
      message: "Conexão OK",
      account: {
        name: data?.name,
        email: data?.email,
        walletId: data?.walletId,
        companyType: data?.companyType,
        cpfCnpj: data?.cpfCnpj,
      },
      balance,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, message: (e as Error).message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
