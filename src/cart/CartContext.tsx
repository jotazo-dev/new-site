import * as React from "react";
import { toast } from "sonner";
import type { Plan } from "@/data/plans";
import { unmarkChipBannerGift } from "@/cart/mobileChipBannerGift";
import { unmarkFiberFromBanner } from "@/cart/fiberFromBanner";
import { computeCartTotals } from "@/cart/pricing";

import { Chip5GCelebrationToast } from "@/components/shop/Chip5GCelebrationToast";

const CHIP_TOAST_OPTS = {
  position: "top-center" as const,
  duration: 6000,
  unstyled: true,
  classNames: { toast: "!bg-transparent !border-0 !shadow-none !p-0" },
};

function showChipToast(id: string, title: string, description?: string) {
  toast.custom(
    (tid) => (
      <Chip5GCelebrationToast
        title={title}
        description={description}
        onClose={() => toast.dismiss(tid)}
      />
    ),
    { ...CHIP_TOAST_OPTS, id }
  );
}

export type CartItem = {
  plan: Plan;
  qty: number;
  /** Promo override por item: quando >0, item é grátis nesses primeiros N meses
   *  e volta ao preço normal a partir do (N+1)º mês. Usado por links de combo
   *  específicos (ex: chip 5G grátis por 3 meses). */
  promoFreeMonths?: number;
};

type CartState = {
  items: CartItem[];
};

export type AddOptions = {
  promoFreeMonths?: number;
  /** Quando true, suprime todos os toasts/confete disparados pelo add (ex: hidratação por link). */
  silent?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  totalCents: number;
  add: (plan: Plan, opts?: AddOptions) => void;
  remove: (planId: string) => void;
  setQty: (planId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null); // v3

const STORAGE_KEY = "jotazo_cart_v1";

function calcTotalCents(items: CartItem[]) {
  return computeCartTotals(items, []).totalCents;
}

function calcCount(items: CartItem[]) {
  const raw = items.reduce((acc, it) => acc + it.qty, 0);
  // Visual unification: the two "Serviço de Roaming" entries (sva da fibra +
  // voz do chip 5G) are shown as a SINGLE line in the cart/summary, so the
  // header badge should count them as one item too.
  const roamingCount = items.filter(
    (i) => (i.plan as any).type === "sva" || (i.plan as any).type === "voz",
  ).length;
  if (roamingCount >= 2) return raw - (roamingCount - 1);
  return raw;
}

export const COMBO_DISCOUNT_CENTS = 0; // Desconto combo desativado
export const COMBO_COUPON_CODE = "COMBO-JOTAZO";

export function calcComboDiscountCents(items: CartItem[]) {
  const hasFibra = items.some((i) => i.plan.category === "fibra");
  const hasMovel = items.some((i) => i.plan.category === "movel");
  return hasFibra && hasMovel ? COMBO_DISCOUNT_CENTS : 0;
}

export function isComboActive(items: CartItem[]) {
  return calcComboDiscountCents(items) > 0;
}

async function triggerComboConfetti() {
  // Lazy-load canvas-confetti only when a combo is actually formed.
  // Saves ~25 KB from the initial vendor bundle on every page.
  const { default: confetti } = await import("canvas-confetti");
  const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 9999, colors: ["#25D366", "#1e88e5", "#fb923c", "#ffffff"] };
  const fire = (particleRatio: number, opts: Parameters<typeof confetti>[0]) =>
    confetti({ ...defaults, ...opts, particleCount: Math.floor(120 * particleRatio) });
  fire(0.25, { spread: 26, startVelocity: 55, origin: { y: 0.7 } });
  fire(0.2, { spread: 60, origin: { y: 0.7 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9, origin: { y: 0.7 } });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { y: 0.7 } });
  fire(0.1, { spread: 120, startVelocity: 45, origin: { y: 0.7 } });
}

function loadInitial(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed?.items) return { items: [] };
    return parsed;
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CartState>(() => loadInitial());

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const value = React.useMemo<CartContextValue>(() => {
    const add = (plan: Plan, opts?: AddOptions) => {
      // Acumula toasts a disparar fora do updater (evita duplicatas se o updater rodar 2x).
      const pendingToasts: Array<() => void> = [];
      let blocked = false;

      setState((prev) => {
        // Reset toasts/flag para esta execução do updater (caso rode novamente).
        pendingToasts.length = 0;
        blocked = false;

        const existing = prev.items.find((i) => i.plan.id === plan.id);
        if (existing) return prev; // já existe, não duplica

        // TV pode ser contratada de forma avulsa (sem Fibra no carrinho)

        // Upsells, SVAs, and voice service plans never replace — just add to cart
        const isUpsell = (plan as any).type === "upsell" || (plan as any).type === "sva" || (plan as any).type === "voz";

        // Regra: apenas 1 plano por categoria (fibra, TV) — substitui o existente.
        // Móvel permite múltiplos chips diferentes coexistindo.
        const SINGLE_CATEGORIES = ["fibra", "tv"] as const;
        let baseItems = prev.items;
        if (!isUpsell && (SINGLE_CATEGORIES as readonly string[]).includes(plan.category)) {
          const current = prev.items.find((i) => i.plan.category === plan.category && (i.plan as any).type !== "upsell" && (i.plan as any).type !== "sva" && (i.plan as any).type !== "voz");
          if (current) {
            baseItems = prev.items.filter((i) => !(i.plan.category === plan.category && (i.plan as any).type !== "upsell" && (i.plan as any).type !== "sva" && (i.plan as any).type !== "voz"));
            const labelMap: Record<string, string> = {
              fibra: "fibra",
              movel: "móvel",
              tv: "TV",
            };
            pendingToasts.push(() =>
              toast.info(`Plano de ${labelMap[plan.category] ?? plan.category} substituído`, {
                description: `${current.plan.name} foi trocado por ${plan.name}.`,
                duration: 3500,
              })
            );
          }
        }

        // Confetti + toast when adding a mobile plan while fiber is already in cart.
        // Skip for auto-added "voz" (Serviço de Roaming) lines so we don't show a duplicate toast.
        const isVozLine = (plan as any).type === "voz";
        const willFormCombo =
          !isVozLine &&
          plan.category === "movel" &&
          baseItems.some((i) => i.plan.category === "fibra");
        if (willFormCombo) {
          pendingToasts.push(() => {
            triggerComboConfetti();
          });
          // Popup grande "Parabéns combo completo!" só é disparado pelo fluxo
          // do banner (PersonalizeSeuCombo via ?items=...). Aqui, mesmo para
          // chip Black, mostramos apenas o toast lateral.
          pendingToasts.push(() =>
            showChipToast(
              `combo-mobile-${plan.id}`,
              "🎉 Desconto especial no Chip 5G aplicado!",
              "O valor do combo foi aplicado automaticamente."
            )
          );
        }

        // Toast for standalone mobile chip (no fiber/combo) — also skip auto-added voz lines.
        if (
          !isVozLine &&
          plan.category === "movel" &&
          !willFormCombo
        ) {
          if ((plan as any).chipType === "black") {
            pendingToasts.push(() =>
              showChipToast(
                `mobile-black-${plan.id}`,
                "Parabéns combo completo! Você adicionou plano 5G Black Jotazo",
                "Tecnologia Avançada Dual Channel. WhatsApp Ilimitado. Gigas Acumulado."
              )
            );
          } else {
            pendingToasts.push(() =>
              showChipToast(
                `mobile-5g-${plan.id}`,
                `📶 ${plan.name} adicionado!`,
                "Combine com Fibra e ganhe desconto especial no combo."
              )
            );
          }
        }

        // Toast when adding SVA
        if ((plan as any).type === "sva") {
          pendingToasts.push(() =>
            toast.success(`🎬 Ótima escolha! ${plan.name} adicionado ao seu combo!`, {
              description: "Aproveite o melhor do entretenimento.",
              duration: 4000,
              id: `sva-${plan.id}`,
            })
          );
        }

        const newItem: CartItem = { plan, qty: 1 };
        if (opts?.promoFreeMonths && opts.promoFreeMonths > 0) {
          newItem.promoFreeMonths = opts.promoFreeMonths;
        }
        return { items: [...baseItems, newItem] };
      });

      // Dispara os toasts uma única vez, fora do updater (evita duplicatas).
      // Nunca disparar toasts para o "Serviço de Roaming" (voz auto-adicionado).
      if ((plan as any).type !== "voz" && !opts?.silent) {
        queueMicrotask(() => {
          pendingToasts.forEach((fn) => fn());
        });
      }
    };

    const remove = (planId: string) => {
      setState((prev) => {
        const removedItem = prev.items.find((i) => i.plan.id === planId);
        let next = prev.items.filter((i) => i.plan.id !== planId);

        if (removedItem?.plan.category === "movel") {
          unmarkChipBannerGift(planId);
        }

        if (removedItem?.plan.category === "fibra") {
          unmarkFiberFromBanner(planId);
          const hadTv = next.some((i) => i.plan.category === "tv");
          next = next.filter((i) => i.plan.category !== "tv");
          if (hadTv) {
            toast.info("Plano de TV removido", {
              description: "O plano de TV requer Internet Fibra.",
              duration: 3500,
            });
          }
        }

        return { items: next };
      });
    };

    const setQty = (planId: string, qty: number) => {
      setState((prev) => {
        const item = prev.items.find((i) => i.plan.id === planId);
        if (!item) return prev;
        // Allow qty > 1 for mobile plans and voz (voz syncs with mobile qty)
        const isMovel = item.plan.category === "movel" && (item.plan as any).type !== "sva";
        if (!isMovel && qty > 1) return prev;
        if (qty <= 0) return { items: prev.items.filter((i) => i.plan.id !== planId) };
        return { items: prev.items.map((i) => i.plan.id === planId ? { ...i, qty } : i) };
      });
    };

    const clear = () => setState({ items: [] });

    const totalCents = calcTotalCents(state.items);
    const count = calcCount(state.items);

    return {
      items: state.items,
      count,
      totalCents,
      add,
      remove,
      setQty,
      clear,
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
