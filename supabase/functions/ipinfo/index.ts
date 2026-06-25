// Lovable Cloud Function: ipinfo
// Secure proxy for ipinfo.io JSON API (keeps token server-side)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

type Cached = {
  expiresAt: number;
  value: unknown;
};

const cache = new Map<string, Cached>();
const TTL_MS = 15 * 60 * 1000; // 15 min

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const token = Deno.env.get("IPINFO_TOKEN");
  if (!token) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const ip = getClientIp(req);
  const cacheKey = `ip:${ip}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return jsonResponse(hit.value, 200, { "Cache-Control": "public, max-age=900" });
  }

  try {
    const ipPath = ip !== "unknown" ? `${ip}/` : "";
    const url = `https://ipinfo.io/${ipPath}json?token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "lovable-ipinfo-proxy",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return jsonResponse(
        {
          error: "Failed to fetch ip info",
          status: res.status,
          details: text.slice(0, 300),
        },
        502,
      );
    }

    const data = (await res.json()) as any;

    const payload = {
      ip: data?.ip ?? null,
      org: data?.org ?? null,
      city: data?.city ?? null,
      region: data?.region ?? null,
      country: data?.country ?? null,
    };

    cache.set(cacheKey, { value: payload, expiresAt: now + TTL_MS });

    return jsonResponse(payload, 200, { "Cache-Control": "public, max-age=900" });
  } catch (e) {
    return jsonResponse({ error: "Unexpected error", message: String(e) }, 500);
  }
});
