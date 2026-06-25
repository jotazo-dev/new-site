// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // valida user autenticado
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: claims.claims.sub, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const envOverride = body?.environment as "sandbox" | "production" | undefined;

    const { data: cfg } = await admin.from("mp_config").select("*").limit(1).maybeSingle();
    if (!cfg) return json({ error: "Config Mercado Pago não encontrada" }, 404);
    const env = envOverride || cfg.environment;
    const token = env === "production" ? cfg.access_token_production : cfg.access_token_sandbox;
    if (!token) return json({ ok: false, message: `Access Token (${env}) não configurado` }, 400);

    const started = Date.now();
    const r = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const duration = Date.now() - started;
    const data = await r.json().catch(() => null);

    await admin.from("mp_logs").insert({
      direction: "outbound",
      endpoint: "/users/me (test)",
      method: "GET",
      status_code: r.status,
      response_body: data,
      duration_ms: duration,
    });

    if (!r.ok) {
      return json({ ok: false, message: data?.message || `HTTP ${r.status}`, raw: data, environment: env }, 200);
    }
    return json({
      ok: true,
      message: `Conexão OK (${env}) — nickname ${data?.nickname || data?.id}`,
      environment: env,
      user: { id: data?.id, nickname: data?.nickname, email: data?.email, site_id: data?.site_id, country_id: data?.country_id },
      duration_ms: duration,
    });
  } catch (e) {
    return json({ ok: false, message: (e as Error).message }, 500);
  }
});

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
