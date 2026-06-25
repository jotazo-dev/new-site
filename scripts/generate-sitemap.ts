// Runs after `vite build` via the postbuild npm hook; writes dist/sitemap.xml.
// Pulls public routes from `sitemap_pages` and blog posts from `blog_posts`.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = (process.env.SITE_BASE_URL || "https://jotazo.com.br").replace(/\/+$/, "");
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://lcbgiersxjeyjcstrxmc.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjYmdpZXJzeGpleWpjc3RyeG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDg2NDEsImV4cCI6MjA4NzQ4NDY0MX0.eqI9-OBBc4HPcIFEiH1GdNtGDb9k0ogy5bPYsDKyhpc";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

function urlXml(loc: string, e: SitemapEntry) {
  return [
    `  <url>`,
    `    <loc>${loc}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    `    <xhtml:link rel="alternate" hreflang="pt-BR" href="${loc}" />`,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: pages, error: pagesErr } = await supabase
    .from("sitemap_pages")
    .select("path, priority, changefreq")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (pagesErr) console.warn("sitemap_pages unavailable:", pagesErr.message);

  const { data: posts, error: postsErr } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (postsErr) console.warn("blog_posts unavailable:", postsErr.message);

  const { data: cities, error: citiesErr } = await supabase
    .from("coverage_cities")
    .select("name, updated_at")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (citiesErr) console.warn("coverage_cities unavailable:", citiesErr.message);


  function citySlugify(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const urls: string[] = [];

  for (const p of pages ?? []) {
    urls.push(urlXml(`${BASE_URL}${p.path}`, { path: p.path, priority: p.priority, changefreq: p.changefreq }));
  }

  for (const post of posts ?? []) {
    if (!post.slug) continue;
    const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split("T")[0] : undefined;
    urls.push(
      urlXml(`${BASE_URL}/blog/${post.slug}`, {
        path: `/blog/${post.slug}`,
        lastmod,
        changefreq: "monthly",
        priority: "0.6",
      })
    );
  }

  for (const c of cities ?? []) {
    if (!c.name) continue;
    const slug = citySlugify(c.name);
    const lastmod = c.updated_at ? new Date(c.updated_at).toISOString().split("T")[0] : undefined;
    urls.push(
      urlXml(`${BASE_URL}/cobertura/${slug}`, {
        path: `/cobertura/${slug}`,
        lastmod,
        changefreq: "weekly",
        priority: "0.7",
      })
    );
  }

  // Deduplicate by <loc> to avoid duplicate URLs (bad for SEO)
  const seen = new Set<string>();
  const uniqueUrls = urls.filter((u) => {
    const m = u.match(/<loc>([^<]+)<\/loc>/);
    const loc = m?.[1];
    if (!loc || seen.has(loc)) return false;
    seen.add(loc);
    return true;
  });

  const xmlOut = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...uniqueUrls,
    `</urlset>`,
  ].join("\n");

  // Write to public/ so it's served at /sitemap.xml in dev, preview AND prod
  writeFileSync(resolve("public/sitemap.xml"), xmlOut);
  try { writeFileSync(resolve("dist/sitemap.xml"), xmlOut); } catch {}
  console.log(`sitemap.xml written (${uniqueUrls.length} entries)`);
}

main().catch((e) => {
  console.error("Failed to generate sitemap:", e);
  process.exit(1);
});
