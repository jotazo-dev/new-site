/**
 * Registro persistente de chips móveis que entraram no carrinho pelo fluxo
 * de banner (URL `?items=...` ou auto-add disparado por fibra qualifying
 * vinda do banner). Apenas chips marcados aqui recebem a promo "3 meses
 * grátis" no totalizador.
 */
const STORAGE_KEY = "jotazo_mobile_chip_banner_gift_v1";

function read(): Set<string> {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

function write(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function markChipBannerGift(planId: string) {
  if (!planId) return;
  const s = read();
  if (s.has(planId)) return;
  s.add(planId);
  write(s);
}

export function unmarkChipBannerGift(planId: string) {
  if (!planId) return;
  const s = read();
  if (!s.has(planId)) return;
  s.delete(planId);
  write(s);
}

export function isChipBannerGift(planId: string): boolean {
  if (!planId) return false;
  return read().has(planId);
}

export function clearAllChipBannerGifts() {
  write(new Set());
}
