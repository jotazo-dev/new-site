import { type Plan, type PlanCategory } from "@/data/plans";

type TabKey = "todos" | "combos" | "internet_fibra" | "internet_movel" | "streaming_tv";

function interleaveByCategory(all: Plan[], order: PlanCategory[]) {
  const buckets = new Map<PlanCategory, Plan[]>();
  for (const cat of order) buckets.set(cat, []);

  for (const p of all) {
    const arr = buckets.get(p.category);
    if (arr) arr.push(p);
  }

  const max = Math.max(...order.map((c) => buckets.get(c)?.length ?? 0), 0);
  const out: Plan[] = [];

  for (let i = 0; i < max; i++) {
    for (const cat of order) {
      const item = buckets.get(cat)?.[i];
      if (item) out.push(item);
    }
  }

  return out;
}

export function pickPlansForTab(key: TabKey, plans: Plan[], limit = 6) {
  const base = plans.filter((p) => (p as any).type !== "upsell" && (p as any).type !== "voz");

  if (key === "todos") {
    return interleaveByCategory(base, ["fibra", "combo", "tv", "movel"]).slice(0, limit);
  }

  if (key === "streaming_tv") {
    return base.filter((p) => p.category === "tv").slice(0, limit);
  }

  if (key === "combos") {
    const combos = base.filter((p) => p.category === "combo");
    if (combos.length === 0) return [];
    if (combos.length >= 3) return combos.slice(0, limit);
    const fibras = base.filter((p) => p.category === "fibra");
    return [...combos, ...fibras].slice(0, limit);
  }

  if (key === "internet_fibra") {
    return base.filter((p) => p.category === "fibra").slice(0, limit);
  }

  if (key === "internet_movel") {
    return base.filter((p) => p.category === "movel").slice(0, limit);
  }

  return base.slice(0, limit);
}

export type { TabKey };
