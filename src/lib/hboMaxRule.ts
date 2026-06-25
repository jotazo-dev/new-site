import type { Plan } from "@/data/plans";

/**
 * Regra HBO Max:
 * O SVA "HBO Max" só pode ser adquirido quando o plano de TV no carrinho
 * for um dos seguintes: "Start HD", "Top HD" ou "Premium HD".
 * Quando o plano for "Life Line HD" (ou nenhum), o HBO Max NÃO deve aparecer
 * e deve ser removido do carrinho caso esteja presente.
 */

export const HBO_ALLOWED_TV_PLANS = ["Start HD", "Top HD", "Premium HD"] as const;

export function isHboMaxSva(plan: Pick<Plan, "name" | "category" | "type">): boolean {
  if ((plan as any).type !== "sva") return false;
  if (plan.category !== "tv") return false;
  return /hbo\s*max/i.test(plan.name);
}

export function isHboCompatibleTvPlan(plan?: Pick<Plan, "name" | "category" | "type"> | null): boolean {
  if (!plan) return false;
  if (plan.category !== "tv") return false;
  if ((plan as any).type === "sva") return false;
  const name = plan.name.trim().toLowerCase();
  return HBO_ALLOWED_TV_PLANS.some((n) => n.toLowerCase() === name);
}
