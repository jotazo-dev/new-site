export type PlanCategory = "fibra" | "movel" | "tv" | "combo";

export type PlanBadge = "Mais vendido" | "Melhor custo-benefício" | "Oferta";

export type PlanIncludeItem = {
  icon: string;
  text: string;
};

export type Plan = {
  id: string;
  category: PlanCategory;
  originalPriceCents?: number;
  name: string;
  priceCents: number;
  description: string;
  conditions: string;
  includes: PlanIncludeItem[];
  badges?: PlanBadge[];
  type?: string;
  icon?: string;
  logoUrl?: string;
  svaIds?: string[];
  accentColor?: string;
  accentLabel?: string;
  comboDiscountPercent?: number;
  comboPriceCents?: number;
  comboHighlightText?: string;
  chipType?: string;
  portabilityGb?: number;
  portabilityLabel?: string;
  /** Duração em meses do valor promocional. 0 = permanente. Após esse período, volta a originalPriceCents. */
  promoMonths?: number;
};

export function formatBRL(priceCents: number) {
  return (priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
