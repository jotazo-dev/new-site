import type { Plan } from "./plans";

/**
 * Conjunto de planos estáticos usado quando o Supabase está desativado
 * (ou retorna vazio). Mantém a home apresentável em modo offline / sem banco.
 */
export const fallbackPlans: Plan[] = [
  {
    id: "fallback-fibra-300",
    category: "fibra",
    name: "Fibra 300 Mega",
    priceCents: 8990,
    originalPriceCents: 10990,
    description: "Internet fibra óptica de 300 Mega para uso doméstico.",
    conditions: "Promoção válida nos 3 primeiros meses. Após, R$ 109,90.",
    includes: [
      { icon: "wifi", text: "Wi-Fi 6 incluso" },
      { icon: "check", text: "Instalação gratuita" },
      { icon: "check", text: "Sem fidelidade" },
    ],
    badges: ["Oferta"],
    type: "internet",
    promoMonths: 3,
  },
  {
    id: "fallback-fibra-600",
    category: "fibra",
    name: "Fibra 600 Mega",
    priceCents: 11990,
    originalPriceCents: 13990,
    description: "Velocidade ideal para streaming 4K e home office.",
    conditions: "Promoção válida nos 3 primeiros meses. Após, R$ 139,90.",
    includes: [
      { icon: "wifi", text: "Wi-Fi 6 incluso" },
      { icon: "check", text: "Instalação gratuita" },
      { icon: "check", text: "Suporte 24/7" },
    ],
    badges: ["Mais vendido"],
    type: "internet",
    promoMonths: 3,
  },
  {
    id: "fallback-fibra-1000",
    category: "fibra",
    name: "Fibra 1 Giga",
    priceCents: 15990,
    originalPriceCents: 17990,
    description: "A máxima performance para gamers e famílias conectadas.",
    conditions: "Promoção válida nos 3 primeiros meses. Após, R$ 179,90.",
    includes: [
      { icon: "wifi", text: "Roteador Wi-Fi 6 Mesh" },
      { icon: "check", text: "Instalação gratuita" },
      { icon: "check", text: "IP fixo opcional" },
    ],
    badges: ["Melhor custo-benefício"],
    type: "internet",
    promoMonths: 3,
  },
  {
    id: "fallback-tv-essencial",
    category: "tv",
    name: "TV Essencial",
    priceCents: 4990,
    description: "Mais de 80 canais HD com guia de programação.",
    conditions: "Necessário plano de internet ativo.",
    includes: [
      { icon: "check", text: "80+ canais HD" },
      { icon: "check", text: "Guia de programação" },
    ],
    type: "tv",
  },
  {
    id: "fallback-tv-premium",
    category: "tv",
    name: "TV Premium",
    priceCents: 8990,
    description: "Canais premium, esportes e filmes inclusos.",
    conditions: "Necessário plano de internet ativo.",
    includes: [
      { icon: "check", text: "150+ canais HD" },
      { icon: "check", text: "Pacote esportes" },
      { icon: "check", text: "Filmes premium" },
    ],
    badges: ["Mais vendido"],
    type: "tv",
  },
];
