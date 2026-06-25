/**
 * Prerender estático do SPA.
 *
 * Após `vite build`, sobe um servidor local servindo `dist/`, abre cada rota
 * pública no Chromium headless, espera o React + react-helmet-async terminarem
 * de renderizar e salva o HTML resultante como `dist/<rota>/index.html`.
 *
 * Resultado: crawlers que não executam JS (parte do ChatGPT/Perplexity/Claude,
 * bots sociais, mecanismos sem JS) recebem HTML completo com JSON-LD.
 *
 * Falhas individuais NÃO quebram o build — o SPA continua funcionando.
 */

import { createServer } from "http";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, resolve, join } from "path";
import sirv from "sirv";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";

const DIST = resolve("dist");
const PORT = 4174;

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://lcbgiersxjeyjcstrxmc.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjYmdpZXJzeGpleWpjc3RyeG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDg2NDEsImV4cCI6MjA4NzQ4NDY0MX0.eqI9-OBBc4HPcIFEiH1GdNtGDb9k0ogy5bPYsDKyhpc";

function citySlugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const STATIC_ROUTES = [
  "/",
  "/para-voce",
  "/para-empresas",
  "/planos",
  "/cobertura",
  "/atendimento",
  "/teste-de-velocidade",
  "/sobre",
  "/blog",
  "/transparencia-rede",
  "/streaming",
  "/internet-movel",
  "/ouvidoria",
  "/trabalhe-conosco",
  "/planos-chip",
  "/indique",
  "/ajuda",
  "/privacidade",
  "/termos",
  "/cookies",
  "/regulamento",
];

async function collectRoutes(): Promise<string[]> {
  const routes = new Set<string>(STATIC_ROUTES);
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("active", true);
    for (const p of posts ?? []) {
      if (p.slug) routes.add(`/blog/${p.slug}`);
    }

    const { data: cities } = await supabase
      .from("coverage_cities")
      .select("name")
      .eq("active", true);
    for (const c of cities ?? []) {
      if (c.name) routes.add(`/cobertura/${citySlugify(c.name)}`);
    }
  } catch (e) {
    console.warn("[prerender] falha ao buscar rotas dinâmicas:", (e as Error).message);
  }
  return Array.from(routes);
}

function startServer() {
  const handler = sirv(DIST, { single: true, dev: false, etag: false });
  const server = createServer((req, res) => handler(req, res, () => {
    res.statusCode = 404;
    res.end();
  }));
  return new Promise<() => Promise<void>>((res) => {
    server.listen(PORT, () => {
      res(() => new Promise<void>((r) => server.close(() => r())));
    });
  });
}

function outPath(route: string): string {
  if (route === "/") return join(DIST, "index.html");
  return join(DIST, route.replace(/^\/+/, ""), "index.html");
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.warn("[prerender] dist/index.html não encontrado — pulando.");
    return;
  }

  const routes = await collectRoutes();
  console.log(`[prerender] ${routes.length} rotas`);

  const stop = await startServer();

  let browser: import("puppeteer").Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    let ok = 0;
    let fail = 0;

    for (const route of routes) {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 1280, height: 800 });
        // Bloqueia recursos pesados (imagens/fontes) que não afetam o HTML/JSON-LD
        await page.setRequestInterception(true);
        page.on("request", (req) => {
          const type = req.resourceType();
          if (type === "image" || type === "media" || type === "font") {
            req.abort();
          } else {
            req.continue();
          }
        });

        const url = `http://127.0.0.1:${PORT}${route}`;
        await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
        // Garante que helmet processou e React montou
        await page
          .waitForSelector("[data-prerendered-ready]", { timeout: 5000 })
          .catch(() => null);
        // Pequeno extra para JSON-LD assíncrono
        await new Promise((r) => setTimeout(r, 200));

        await page.evaluate(`
          document.body.removeAttribute("data-scroll-locked");
          document.body.style.pointerEvents = "";
          document
            .querySelectorAll('[data-radix-focus-guard], body > [data-state="open"][role="dialog"], body > [data-state="open"].fixed')
            .forEach((node) => node.remove());
        `);

        const html = await page.content();
        const file = outPath(route);
        mkdirSync(dirname(file), { recursive: true });
        // Marca para debug
        const tagged = html.replace(
          "<head>",
          '<head>\n    <meta name="x-prerendered" content="true">'
        );
        writeFileSync(file, tagged);
        ok++;
      } catch (e) {
        fail++;
        console.warn(`[prerender] falha em ${route}:`, (e as Error).message);
      } finally {
        await page.close();
      }
    }

    console.log(`[prerender] concluído: ${ok} ok, ${fail} falhas`);
  } finally {
    if (browser) await browser.close();
    await stop();
  }
}

main().catch((e) => {
  // NUNCA falhar o build inteiro por causa do prerender
  console.warn("[prerender] erro fatal (build continua):", (e as Error).message);
  process.exit(0);
});
