// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (status: number, body: any) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Cache simples em memória da função
const cache = new Map<string, { posts: any[]; expiresAt: number }>();

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function readSettings() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("instagram_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`db: ${error.message}`);
  return { supabase, settings: data as any };
}

async function fetchMedia(token: string, igId: string, limit: number) {
  const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(igId)}/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Graph API error ${res.status}`);
  }
  return (data?.data || []).map((m: any) => ({
    id: m.id,
    caption: m.caption || "",
    type: m.media_type,
    image: m.media_type === "VIDEO" ? m.thumbnail_url || m.media_url : m.media_url,
    link: m.permalink,
    timestamp: m.timestamp,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "feed";

    if (action === "test") {
      const denied = await requireAdmin(req);
      if (denied) return denied;
      const body = await req.json().catch(() => ({}));
      const token = (body.access_token as string) || "";
      const igId = (body.business_account_id as string) || "";
      if (!token || !igId) return json(400, { ok: false, error: "Token e Business Account ID são obrigatórios" });
      try {
        const posts = await fetchMedia(token, igId, 1);
        return json(200, { ok: true, sample_count: posts.length });
      } catch (e: any) {
        return json(200, { ok: false, error: e.message });
      }
    }

    if (action === "refresh_token") {
      const denied = await requireAdmin(req);
      if (denied) return denied;
      const { supabase, settings } = await readSettings();
      if (!settings?.access_token) return json(400, { ok: false, error: "Sem token configurado" });
      const refreshUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=&client_secret=&fb_exchange_token=${encodeURIComponent(settings.access_token)}`;
      // Para Instagram Basic Display use ig_refresh_token; para Graph API (Business) use o endpoint acima ou debug_token.
      const igRefreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(settings.access_token)}`;
      // Tenta primeiro o ig_refresh_token (Basic Display), cai para debug_token caso falhe
      let newToken = settings.access_token;
      let expiresIn = 60 * 60 * 24 * 60; // 60 dias padrão
      try {
        const r = await fetch(igRefreshUrl);
        const d = await r.json();
        if (r.ok && d.access_token) {
          newToken = d.access_token;
          expiresIn = d.expires_in || expiresIn;
        } else {
          throw new Error(d?.error?.message || "Falha no refresh");
        }
      } catch (e: any) {
        return json(200, { ok: false, error: e.message });
      }
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      await supabase
        .from("instagram_settings")
        .update({ access_token: newToken, token_expires_at: expiresAt })
        .eq("id", settings.id);
      cache.clear();
      return json(200, { ok: true, expires_at: expiresAt });
    }

    // Action padrão: feed
    const { settings } = await readSettings();
    if (!settings || !settings.active || !settings.access_token || !settings.business_account_id) {
      return json(200, { posts: [] });
    }

    const cacheKey = `${settings.id}:${settings.post_count}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return json(200, { posts: cached.posts, cached: true });
    }

    try {
      const posts = await fetchMedia(settings.access_token, settings.business_account_id, settings.post_count);
      cache.set(cacheKey, {
        posts,
        expiresAt: Date.now() + (settings.cache_minutes || 30) * 60 * 1000,
      });
      return json(200, { posts });
    } catch (e: any) {
      console.error("instagram-feed fetch error:", e.message);
      return json(200, { posts: [], error: e.message });
    }
  } catch (e: any) {
    console.error("instagram-feed error:", e);
    return json(500, { error: e.message });
  }
});
