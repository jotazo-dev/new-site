import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_BASE_URL = "https://jotazo.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch base_url from settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "base_url")
      .maybeSingle();

    const baseUrl = (settingsData?.value || FALLBACK_BASE_URL).replace(/\/+$/, "");

    // Fetch active sitemap pages from DB
    const { data: sitemapPages } = await supabase
      .from("sitemap_pages")
      .select("path, priority, changefreq")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    // Fetch active blog posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    // Fetch active coverage cities
    const { data: cities } = await supabase
      .from("coverage_cities")
      .select("name, updated_at")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    function citySlugify(name: string): string {
      return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Build URL entries
    const urls: string[] = [];

    if (sitemapPages) {
      for (const page of sitemapPages) {
        const loc = `${baseUrl}${page.path}`;
        urls.push(`  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${loc}" />
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
  </url>`);
      }
    }

    if (posts) {
      for (const post of posts) {
        if (!post.slug) continue;
        const lastmod = post.updated_at ? `\n    <lastmod>${new Date(post.updated_at).toISOString().split("T")[0]}</lastmod>` : "";
        const blogLoc = `${baseUrl}/blog/${post.slug}`;
        urls.push(`  <url>
    <loc>${blogLoc}</loc>${lastmod}
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${blogLoc}" />
    <priority>0.6</priority>
    <changefreq>monthly</changefreq>
  </url>`);
      }
    }

    if (cities) {
      for (const c of cities) {
        if (!c.name) continue;
        const slug = citySlugify(c.name);
        const lastmod = c.updated_at ? `\n    <lastmod>${new Date(c.updated_at).toISOString().split("T")[0]}</lastmod>` : "";
        const cityLoc = `${baseUrl}/cobertura/${slug}`;
        urls.push(`  <url>
    <loc>${cityLoc}</loc>${lastmod}
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${cityLoc}" />
    <priority>0.7</priority>
    <changefreq>weekly</changefreq>
  </url>`);
      }
    }

    // Deduplicate by <loc> to avoid duplicate URLs in sitemap (bad for SEO)
    const seen = new Set<string>();
    const uniqueUrls = urls.filter((u) => {
      const m = u.match(/<loc>([^<]+)<\/loc>/);
      const loc = m?.[1];
      if (!loc || seen.has(loc)) return false;
      seen.add(loc);
      return true;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${uniqueUrls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        ...corsHeaders,
      },
    });
  } catch (e) {
    console.error("Sitemap error:", e);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
