import type { Plan } from "@/data/plans";
import type { CartItem } from "@/cart/CartContext";

/** Query param key used to encode the shared combo. */
export const SHARE_PARAM = "items";

/**
 * Build a shareable URL for the current cart, encoding plan IDs as
 * a comma-separated list in the `items` query param. Quantities >1
 * são codificadas como `id*qty`. Flags adicionais podem ser anexadas
 * com `:` — atualmente suportada `:promofree<N>` para marcar o item
 * como grátis nos primeiros N meses (depois volta ao preço normal).
 *
 * Exemplos:
 *   /personalize-seu-combo?items=abc,def*2
 *   /personalize-seu-combo?items=fiberId,tvId,chipId:promofree3
 */
export function buildShareUrl(items: CartItem[], origin?: string): string {
  const base = `${origin ?? (typeof window !== "undefined" ? window.location.origin : "")}/personalize-seu-combo`;
  if (!items.length) return base;
  const encoded = items
    .map((it) => {
      let token = it.plan.id;
      if (it.qty && it.qty > 1) token += `*${it.qty}`;
      const free = (it as any).promoFreeMonths;
      if (free && free > 0) token += `:promofree${free}`;
      return token;
    })
    .join(",");
  return `${base}?${SHARE_PARAM}=${encoded}`;
}

/** Parse the `items` query string into [{id, qty, promoFreeMonths?}]. */
export function parseShareItems(search: string): Array<{ id: string; qty: number; promoFreeMonths?: number }> {
  const params = new URLSearchParams(search);
  const raw = params.get(SHARE_PARAM);
  if (!raw) return [];
  return raw
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const [head, ...flags] = token.split(":");
      const [id, qtyStr] = head.split("*");
      const qty = Math.max(1, parseInt(qtyStr ?? "1", 10) || 1);
      let promoFreeMonths: number | undefined;
      for (const f of flags) {
        const m = /^promofree(\d+)$/i.exec(f);
        if (m) promoFreeMonths = Math.max(0, parseInt(m[1], 10) || 0);
      }
      return { id, qty, promoFreeMonths };
    });
}

/** Resolve parsed tokens against a plans catalog, preserving order. */
export function resolveShareItems(
  tokens: Array<{ id: string; qty: number; promoFreeMonths?: number }>,
  catalog: Plan[],
): Array<{ plan: Plan; qty: number; promoFreeMonths?: number }> {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const out: Array<{ plan: Plan; qty: number; promoFreeMonths?: number }> = [];
  for (const t of tokens) {
    const plan = byId.get(t.id);
    if (plan) out.push({ plan, qty: t.qty, promoFreeMonths: t.promoFreeMonths });
  }
  return out;
}
