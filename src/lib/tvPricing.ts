import type { Plan } from "@/data/plans";

/**
 * Identifica o plano de TV "base" do combo (mais barato — Life Line HD).
 * Esse plano sempre usa o preço promocional, mesmo avulso, e fica grátis no combo.
 */
export function getCheapestTvPlan(allPlans: Plan[]): Plan | null {
  const tvs = allPlans.filter((p) => p.category === "tv" && (p as any).type !== "sva");
  if (tvs.length === 0) return null;
  return [...tvs].sort((a, b) => a.priceCents - b.priceCents)[0];
}

/**
 * Preço efetivo de exibição/cobrança para um plano de TV:
 * - Avulso (sem fibra no carrinho) → originalPriceCents (preço cheio)
 *   exceção: o plano base (Life Line HD) mantém o preço promocional avulso.
 * - Com fibra no carrinho (combo) → priceCents (promocional)
 */
export function getEffectiveTvPriceCents(
  plan: Plan,
  hasFiberInCart: boolean,
  cheapestTvPlanId?: string | null,
): number {
  if (plan.category !== "tv" || (plan as any).type === "sva") return plan.priceCents;
  const isCheapest = cheapestTvPlanId && plan.id === cheapestTvPlanId;
  if (!hasFiberInCart && !isCheapest && plan.originalPriceCents && plan.originalPriceCents > plan.priceCents) {
    return plan.originalPriceCents;
  }
  return plan.priceCents;
}
