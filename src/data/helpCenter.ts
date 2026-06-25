import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Rocket,
  Wifi,
  Smartphone,
  Tv,
  Wrench,
  Receipt,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { primeirosPassosArticles } from "./helpArticles/primeiros-passos";
import { internetFibraArticles } from "./helpArticles/internet-fibra";
import { movel5gArticles } from "./helpArticles/movel-5g";
import { tvStreamingArticles } from "./helpArticles/tv-streaming";
import { suporteTecnicoArticles } from "./helpArticles/suporte-tecnico";
import { contaPagamentoArticles } from "./helpArticles/conta-pagamento";
import { mudancasCancelamentoArticles } from "./helpArticles/mudancas-cancelamento";
import { privacidadeSegurancaArticles } from "./helpArticles/privacidade-seguranca";

export type HelpArticle = {
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
  updatedAt: string;
  popular?: boolean;
  body: ReactNode;
  related?: { categorySlug: string; articleSlug: string }[];
};

export type HelpCategory = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind text color token
  articles: HelpArticle[];
};

export const helpCategories: HelpCategory[] = [
  {
    slug: "primeiros-passos",
    title: "Primeiros Passos",
    description: "Tudo o que você precisa saber para começar bem com a Jotazo.",
    icon: Rocket,
    accent: "text-primary",
    articles: primeirosPassosArticles,
  },
  {
    slug: "internet-fibra",
    title: "Internet Fibra Óptica",
    description: "Como funciona a fibra, Wi-Fi, velocidade e desempenho.",
    icon: Wifi,
    accent: "text-blue-500",
    articles: internetFibraArticles,
  },
  {
    slug: "movel-5g",
    title: "Internet Móvel 5G",
    description: "Cobertura, ativação, APN, portabilidade e dicas de chip.",
    icon: Smartphone,
    accent: "text-emerald-500",
    articles: movel5gArticles,
  },
  {
    slug: "tv-streaming",
    title: "TV e Streaming",
    description: "Configuração, canais, gravação, controle parental e apps.",
    icon: Tv,
    accent: "text-purple-500",
    articles: tvStreamingArticles,
  },
  {
    slug: "suporte-tecnico",
    title: "Suporte Técnico",
    description: "Diagnóstico, soluções de problemas e leitura de luzes da ONU.",
    icon: Wrench,
    accent: "text-amber-500",
    articles: suporteTecnicoArticles,
  },
  {
    slug: "conta-pagamento",
    title: "Conta, Faturas e Pagamento",
    description: "Boletos, Pix, débito automático, contestação e nota fiscal.",
    icon: Receipt,
    accent: "text-cyan-500",
    articles: contaPagamentoArticles,
  },
  {
    slug: "mudancas-cancelamento",
    title: "Mudanças e Cancelamento",
    description: "Mudança de endereço, upgrade, fidelidade e devolução de equipamentos.",
    icon: RefreshCw,
    accent: "text-rose-500",
    articles: mudancasCancelamentoArticles,
  },
  {
    slug: "privacidade-seguranca",
    title: "Privacidade, Segurança e Anatel",
    description: "Wi-Fi seguro, golpes, LGPD, Ouvidoria e Anatel.",
    icon: ShieldCheck,
    accent: "text-indigo-500",
    articles: privacidadeSegurancaArticles,
  },
];

// Helpers
export function findCategory(slug: string) {
  return helpCategories.find((c) => c.slug === slug);
}

export function findArticle(categorySlug: string, articleSlug: string) {
  const category = findCategory(categorySlug);
  if (!category) return null;
  const article = category.articles.find((a) => a.slug === articleSlug);
  if (!article) return null;
  return { category, article };
}

export function getAllArticles() {
  return helpCategories.flatMap((c) =>
    c.articles.map((a) => ({ category: c, article: a })),
  );
}

export function getPopularArticles(limit = 6) {
  return getAllArticles()
    .filter(({ article }) => article.popular)
    .slice(0, limit);
}

export function searchArticles(query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = getAllArticles();
  const scored = all
    .map((entry) => {
      const { article } = entry;
      const title = article.title.toLowerCase();
      const desc = article.description.toLowerCase();
      const kw = (article.keywords ?? []).join(" ").toLowerCase();
      let score = 0;
      if (title.includes(q)) score += 5;
      if (desc.includes(q)) score += 2;
      if (kw.includes(q)) score += 3;
      // word matches
      q.split(/\s+/).forEach((w) => {
        if (!w) return;
        if (title.includes(w)) score += 1;
        if (desc.includes(w)) score += 0.5;
      });
      return { ...entry, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}
