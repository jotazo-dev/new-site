/**
 * Persistence for "user manually removed Plano 5G Black 4GB free gift" flag.
 * Keyed per fiber plan id so it resets when user picks a different fiber.
 * Used by useCartAutoSync to avoid re-adding the gift after manual removal.
 */

const KEY_PREFIX = "cart:mobile4gFreeManuallyRemoved:";

function key(fiberId: string | null | undefined) {
  return fiberId ? `${KEY_PREFIX}${fiberId}` : null;
}

export function isMobile4gFreeManuallyRemoved(fiberId: string | null | undefined): boolean {
  const k = key(fiberId);
  if (!k || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
}

export function markMobile4gFreeManuallyRemoved(fiberId: string | null | undefined) {
  const k = key(fiberId);
  if (!k || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, "1");
  } catch {
    /* ignore */
  }
}

export function clearMobile4gFreeManuallyRemoved(fiberId: string | null | undefined) {
  const k = key(fiberId);
  if (!k || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
