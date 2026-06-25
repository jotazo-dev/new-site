import type { CartItem } from "@/cart/CartContext";

const extractGiga = (name: string) => {
  const m = name.match(/(\d+)\s*GIGA/i);
  return m ? m[1] : null;
};

// Ordem de exibição no carrinho:
// Fibra → TV → SVA (roaming do fibra) → Móvel (5G) → Voz (roaming de dados do 5G) → Combo
const CATEGORY_ORDER: Record<string, number> = {
  fibra: 0,
  tv: 1,
  sva: 2,
  movel: 3,
  voz: 3.5,
  combo: 4,
};

function categoryKey(item: CartItem): string {
  const t = (item.plan as any).type;
  if (t === "sva") return "sva";
  if (t === "voz") return "voz";
  return item.plan.category;
}

/**
 * Reorders cart items into display groups:
 *  1. Fibra
 *  2. TV (gift quando aplicável fica junto da fibra)
 *  3. SVA Roaming vinculado ao fibra
 *  4. Plano 5G (móvel) — cada chip seguido imediatamente da sua linha de Voz
 *  5. Combo
 */
export function sortCartItemsForDisplay(items: CartItem[]): CartItem[] {
  // 1) Sort estável por categoria de exibição, preservando ordem de inserção dentro do grupo.
  const indexed = items.map((it, i) => ({ it, i }));
  indexed.sort((a, b) => {
    const ka = CATEGORY_ORDER[categoryKey(a.it)] ?? 99;
    const kb = CATEGORY_ORDER[categoryKey(b.it)] ?? 99;
    if (ka !== kb) return ka - kb;
    return a.i - b.i;
  });
  const sorted = indexed.map((x) => x.it);

  // 2) Threading: cada chip 5G recebe a linha de voz correspondente logo abaixo.
  const vozByKey = new Map<string, CartItem>();
  for (const it of sorted) {
    if ((it.plan as any).type === "voz") {
      const key = `${it.plan.description}::${(it.plan as any).chipType ?? ""}`;
      vozByKey.set(key, it);
    }
  }
  const usedVozIds = new Set<string>();
  const result: CartItem[] = [];
  for (const it of sorted) {
    if ((it.plan as any).type === "voz") continue; // colocada via threading
    result.push(it);
    if (
      it.plan.category === "movel" &&
      (it.plan as any).type !== "sva" &&
      (it.plan as any).type !== "upsell" &&
      (it.plan as any).type !== "voz"
    ) {
      const giga = extractGiga(it.plan.name);
      if (giga) {
        const key = `${giga}::${(it.plan as any).chipType ?? ""}`;
        const voz = vozByKey.get(key);
        if (voz && !usedVozIds.has(voz.plan.id)) {
          result.push(voz);
          usedVozIds.add(voz.plan.id);
        }
      }
    }
  }
  // Voz órfãs (sem chip correspondente) vão pro final
  for (const it of sorted) {
    if ((it.plan as any).type === "voz" && !usedVozIds.has(it.plan.id)) {
      result.push(it);
    }
  }
  return result;
}
