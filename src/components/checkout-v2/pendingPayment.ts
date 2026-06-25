/**
 * Persistência leve do pagamento pendente (Pix/Boleto) no CheckoutV2.
 * Permite recuperar a tela de "aguardando pagamento" após refresh.
 */
import type { CheckoutCreateResult } from "@/hooks/useCheckoutPayment";

const KEY = "checkoutv2:pendingPayment:v1";

export type PendingPayment = {
  orderId: string;
  method: "pix" | "boleto";
  createdAt: number;
  expiresAt?: string;
  hasMobile: boolean;
  pix?: CheckoutCreateResult["pix"];
  boleto?: CheckoutCreateResult["boleto"];
};

export function savePendingPayment(p: PendingPayment) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch { /* storage full / disabled */ }
}

export function loadPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingPayment;
    if (!p?.orderId || !p?.method) return null;
    // Descarta se já expirou há mais de 1h (evita lixo persistente).
    if (p.expiresAt) {
      const exp = new Date(p.expiresAt).getTime();
      if (Number.isFinite(exp) && Date.now() - exp > 60 * 60 * 1000) {
        clearPendingPayment();
        return null;
      }
    } else if (Date.now() - p.createdAt > 24 * 60 * 60 * 1000) {
      // Sem expiresAt: TTL de 24h.
      clearPendingPayment();
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
