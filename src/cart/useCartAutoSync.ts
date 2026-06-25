import * as React from "react";
import { useCart } from "@/cart/CartContext";
import { usePlans } from "@/hooks/usePlans";
import { isQualifyingFiberForFreeTv, isFreeTvTarget } from "@/cart/pricing";

const MANUAL_REMOVAL_KEY = "jotazo_lifelinehd_removed_v1";

function wasManuallyRemoved(): boolean {
  try { return sessionStorage.getItem(MANUAL_REMOVAL_KEY) === "1"; } catch { return false; }
}
function markRemoved() {
  try { sessionStorage.setItem(MANUAL_REMOVAL_KEY, "1"); } catch {}
}
function clearRemoved() {
  try { sessionStorage.removeItem(MANUAL_REMOVAL_KEY); } catch {}
}

/**
 * Auto-add: quando há fibra qualificadora (550/750/1GIGA) no carrinho,
 * adiciona automaticamente o plano de TV "Life Line HD" (que entra grátis
 * pela regra em pricing.ts). Se a fibra qualificadora sai, limpa o flag de
 * remoção manual; se o usuário remove o Life Line HD enquanto a fibra
 * qualificada está no carrinho, marca como removido manualmente para não
 * re-adicionar.
 */
export function useCartAutoSync() {
  const { items, add } = useCart();
  const { data: plans } = usePlans();
  const prevHadQualifying = React.useRef(false);
  const prevHadLifeLine = React.useRef(false);

  const hasQualifyingFiber = items.some((it) => isQualifyingFiberForFreeTv(it.plan));
  const canAutoAddLifeLine = hasQualifyingFiber;
  const hasLifeLine = items.some((it) => isFreeTvTarget(it.plan));

  React.useEffect(() => {
    // Quando perde a fibra qualificadora, limpa o flag (próxima vez auto-add volta).
    if (prevHadQualifying.current && !canAutoAddLifeLine) {
      clearRemoved();
    }
    // Se tinha Life Line e o usuário removeu enquanto fibra qualificada está, marca remoção manual.
    if (prevHadLifeLine.current && !hasLifeLine && canAutoAddLifeLine) {
      markRemoved();
    }
    prevHadQualifying.current = canAutoAddLifeLine;
    prevHadLifeLine.current = hasLifeLine;
  }, [canAutoAddLifeLine, hasLifeLine]);

  React.useEffect(() => {
    if (!canAutoAddLifeLine || hasLifeLine) return;
    if (wasManuallyRemoved()) return;
    const lifeLine = (plans ?? []).find((p) => isFreeTvTarget(p));
    if (!lifeLine) return;
    add(lifeLine);
  }, [canAutoAddLifeLine, hasLifeLine, plans, add]);
}
