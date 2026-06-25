/**
 * Persistence for "user manually removed Serviço Roaming (SVA)" flag.
 * Keyed per fiber plan id so it resets when user picks a different fiber.
 * Shared by useCartAutoSync (auto-add gate) and the remove-confirmation
 * flows in CartDrawerBody and PersonalizeSeuCombo.
 */

const KEY_PREFIX = "cart:svaManuallyRemoved:";

export function svaRemovalKey(fiberId: string | null | undefined) {
  return fiberId ? `${KEY_PREFIX}${fiberId}` : null;
}

export function isSvaManuallyRemoved(fiberId: string | null | undefined): boolean {
  const k = svaRemovalKey(fiberId);
  if (!k || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
}

export function markSvaManuallyRemoved(fiberId: string | null | undefined) {
  const k = svaRemovalKey(fiberId);
  if (!k || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, "1");
  } catch {
    /* ignore */
  }
}

export function clearSvaManuallyRemoved(fiberId: string | null | undefined) {
  const k = svaRemovalKey(fiberId);
  if (!k || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

/** Remove all SVA-removal flags (e.g., when cart is cleared). */
export function clearAllSvaManuallyRemoved() {
  if (typeof window === "undefined") return;
  try {
    const toDelete: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX)) toDelete.push(k);
    }
    toDelete.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
