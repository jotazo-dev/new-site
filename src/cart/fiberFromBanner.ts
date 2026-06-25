/**
 * Persistence for "fiber plan was added via banner combo flow" flag.
 * Used to gate the Black 4GB gift popup + auto-add. Only the banner flow
 * (URL share-items resolver in /personalize-seu-combo) sets this flag.
 * Card-based "Adicionar ao combo" never sets it, so the gift popup
 * does not appear in that flow.
 */

const KEY_PREFIX = "cart:fiberFromBanner:";

function key(fiberId: string | null | undefined) {
  return fiberId ? `${KEY_PREFIX}${fiberId}` : null;
}

export function isFiberFromBanner(fiberId: string | null | undefined): boolean {
  const k = key(fiberId);
  if (!k || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
}

export function markFiberFromBanner(fiberId: string | null | undefined) {
  const k = key(fiberId);
  if (!k || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, "1");
  } catch {
    /* ignore */
  }
}

export function unmarkFiberFromBanner(fiberId: string | null | undefined) {
  const k = key(fiberId);
  if (!k || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
