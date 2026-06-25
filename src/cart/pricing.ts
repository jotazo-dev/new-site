import type { Plan } from "@/data/plans";
import type { CartItem } from "@/cart/CartContext";
import { sortCartItemsForDisplay } from "@/cart/sortItems";

export type PricingSummaryItem = {
  plan: Plan;
  qty: number;
  freeOverride?: boolean;
  freeConditionText?: string;
  label?: string;
  isSva?: boolean;
  comboDiscount?: boolean;
  comboPriceCents?: number;
  /** Quando >0, item é grátis nesses primeiros N meses e volta ao preço
   *  normal (priceCents ou originalPriceCents) a partir do (N+1)º mês. */
  promoFreeMonths?: number;
};

type PricingUnitItem = Omit<PricingSummaryItem, "qty"> & { qty?: number };

export type CartTotals = {
  summaryItems: PricingSummaryItem[];
  subtotalCents: number;
  comboDiscountCents: number;
  totalCents: number;
  afterPromoTotalCents: number;
  hasMobilePromo: boolean;
  cheapestTvPlan: Plan | null;
  hasFiberInCart: boolean;
  hasVozInCart: boolean;
  tvFreeByFiber: boolean;
  mobileCheapestFreeByFiber: boolean;
  mobileUsesComboPrice: boolean;
  fiberQualifiesPromo: boolean;
  mobileBlack4GBFreeByFiber: boolean;
  fiberCardPromo: boolean;
  hasPromo: boolean;
  promoMonths: number;
  afterPromoMonth: number;
};

// Mantidas exportadas (referenciadas em outros pontos do código), mas sem efeito ativo.
export const FIBER_PROMO_THRESHOLD_CENTS = 9990;
export const TV_FREE_FIBER_SPEED_MB = Number.POSITIVE_INFINITY;
export const BLACK_4GB_FREE_FIBER_SPEEDS_MB: number[] = [];
export const MOBILE_BLACK_4GB_FREE_MONTHS = 0;


export function isMobileBlack4GB(_plan: Plan): boolean {
  return false;
}

export function isMobileBlackChip(_plan: Plan): boolean {
  return false;
}

// === Regra: Life Line HD grátis com fibra qualificada ===
export const TV_FREE_FIBER_PLAN_NAMES = ["550 MEGA", "750 MEGA", "1 GIGA"] as const;
export const TV_FREE_TARGET_NAME = "Life Line HD";
export const TV_FREE_CONDITION_TEXT = "Grátis com fibra 550MB+";

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isQualifyingFiberForFreeTv(plan: Plan): boolean {
  if (plan.category !== "fibra") return false;
  const n = normalizeName(plan.name);
  return TV_FREE_FIBER_PLAN_NAMES.some((name) => normalizeName(name) === n);
}

export function isFreeTvTarget(plan: Plan): boolean {
  if (plan.category !== "tv" || (plan as any).type === "sva") return false;
  return normalizeName(plan.name) === normalizeName(TV_FREE_TARGET_NAME);
}

/**
 * Soma direta qty × priceCents. Sem promo, sem combo, sem gift, sem auto-add.
 * Mantém o mesmo formato de retorno para compatibilidade com a UI existente.
 */
/** Preço efetivo de uma linha do carrinho.
 *  - Fibra: usa preço promocional só quando há combo (fibra + chip).
 *  - Chip 5G (movel, não SVA/voz): só usa preço promocional quando o chip
 *    está em combo com fibra. Sozinho no carrinho, cobra `originalPriceCents`.
 *  TV grátis e SVAs continuam tratados em separado. */
export function getEffectiveLinePriceCents(
  plan: Plan,
  comboActive: boolean,
  _fullComboActive: boolean = comboActive,
): number {
  if (plan.category === "fibra") {
    if (!comboActive && plan.originalPriceCents && plan.originalPriceCents > plan.priceCents) {
      return plan.originalPriceCents;
    }
  }
  if (plan.category === "movel") {
    const t = (plan as any).type;
    const isChip = t !== "sva" && t !== "voz";
    if (isChip && !comboActive && plan.originalPriceCents && plan.originalPriceCents > plan.priceCents) {
      return plan.originalPriceCents;
    }
  }
  return plan.priceCents;
}

function isStandaloneMobileChip(plan: Plan): boolean {
  const t = (plan as any).type;
  return plan.category === "movel" && t !== "sva" && t !== "voz" && t !== "upsell";
}

export function getChargedUnitPriceCents(item: PricingUnitItem): number {
  const { plan } = item;
  if (item.freeOverride) return 0;
  if (item.promoFreeMonths && item.promoFreeMonths > 0) return 0;
  if (item.comboPriceCents != null && item.comboPriceCents > 0) return item.comboPriceCents;

  const hasOriginal = !!plan.originalPriceCents && plan.originalPriceCents > plan.priceCents;
  const shouldUseOriginal =
    hasOriginal &&
    !item.comboDiscount &&
    (plan.category === "fibra" || isStandaloneMobileChip(plan));

  return shouldUseOriginal ? plan.originalPriceCents! : plan.priceCents;
}

export function getSubtotalUnitPriceCents(item: PricingUnitItem): number {
  const { plan } = item;
  if (item.freeOverride) return plan.priceCents;
  if (item.promoFreeMonths && item.promoFreeMonths > 0) {
    return plan.originalPriceCents && plan.originalPriceCents > plan.priceCents
      ? plan.originalPriceCents
      : plan.priceCents;
  }

  const charged = getChargedUnitPriceCents(item);
  if (plan.originalPriceCents && plan.originalPriceCents > charged) {
    return plan.originalPriceCents;
  }
  return charged;
}

export function computeCartTotals(items: CartItem[], _allPlans: Plan[]): CartTotals {
  const hasQualifyingFiber = items.some((it) => isQualifyingFiberForFreeTv(it.plan));
  const hasFiber = items.some((it) => it.plan.category === "fibra");
  const hasMobile = items.some((it) => isStandaloneMobileChip(it.plan));
  const hasTv = items.some((it) => it.plan.category === "tv" && (it.plan as any).type !== "sva");
  // Combo SÓ existe quando os 3 componentes estão presentes:
  // Fibra + Chip 5G + TV (não-SVA). Sem isso, fibra e chip pagam o
  // originalPriceCents (sem desconto de combo) e o chip 5G não recebe
  // a promo "3 meses grátis".
  const comboActive = hasFiber && hasMobile && hasTv;

  // Regra: a promo "3 meses grátis" do chip 5G só vale com fibra qualificadora
  // (550 MEGA, 750 MEGA, 1 GIGA). Em downgrade para 100/250 MEGA, a promo cai
  // e o chip passa a somar o valor promocional (priceCents).
  const fiberInCart = items.find((it) => it.plan.category === "fibra");
  const chipPromoDisabledByFiberDowngrade =
    !!fiberInCart && !isQualifyingFiberForFreeTv(fiberInCart.plan);

  const summaryItems: PricingSummaryItem[] = sortCartItemsForDisplay(items).map((it) => {
    // TV Life Line HD é grátis sempre que houver fibra qualificadora (550/750/1GIGA),
    // independente de ter chip 5G no carrinho.
    const free = hasQualifyingFiber && isFreeTvTarget(it.plan);

    const hasOriginal = !!it.plan.originalPriceCents && it.plan.originalPriceCents > it.plan.priceCents;
    const isFiberCombo = comboActive && it.plan.category === "fibra" && hasOriginal;
    const t = (it.plan as any).type;
    const isChip = it.plan.category === "movel" && t !== "sva" && t !== "voz";
    const isChipCombo = comboActive && isChip && hasOriginal;
    const rawPromoFree = Number((it as any).promoFreeMonths) || 0;
    // Promo "3 meses grátis" do chip 5G só vale quando o combo completo
    // (Fibra + Chip + TV) está montado e a fibra é >= R$99,90.
    const promoFree = isChip && (!comboActive || chipPromoDisabledByFiberDowngrade)
      ? 0
      : rawPromoFree;
    const promoFreeActive = promoFree > 0;

    return {
      plan: it.plan,
      qty: it.qty,
      label: it.plan.name,
      isSva: t === "sva",
      // Promo "grátis por N meses" também marca freeOverride durante a promo
      // para que toda a UI existente trate como item grátis no momento.
      freeOverride: free || promoFreeActive || undefined,
      freeConditionText: free
        ? TV_FREE_CONDITION_TEXT
        : promoFreeActive
          ? `Grátis nos ${promoFree} primeiros meses`
          : undefined,
      comboDiscount: !promoFreeActive && (isFiberCombo || isChipCombo) || undefined,
      promoFreeMonths: promoFreeActive ? promoFree : undefined,
    };
  });


  const subtotalCents = summaryItems.reduce((acc, it) => {
    return acc + getSubtotalUnitPriceCents(it) * it.qty;
  }, 0);

  const totalCents = summaryItems.reduce((acc, it) => {
    return acc + getChargedUnitPriceCents(it) * it.qty;
  }, 0);

  // Promoção por meses: combina o promoMonths declarado no plano (DB) com
  // promoFreeMonths declarado por item via share-link.
  let promoMonthsMax = 0;
  const afterPromoTotalCents = summaryItems.reduce((acc, it) => {
    const hasOriginal = !!it.plan.originalPriceCents && it.plan.originalPriceCents > it.plan.priceCents;

    // 1) Override por item: grátis por N meses, depois preço promocional vigente.
    // Para chips com originalPriceCents maior (ex.: 4 GIGA: de R$39,90 por R$29,90),
    // o total "a partir do 4º mês" deve voltar para priceCents, não para o valor riscado.
    if (it.promoFreeMonths && it.promoFreeMonths > 0) {
      if (it.promoFreeMonths > promoMonthsMax) promoMonthsMax = it.promoFreeMonths;
      const after = it.comboPriceCents != null && it.comboPriceCents > 0
        ? it.comboPriceCents
        : it.plan.priceCents;
      return acc + after * it.qty;
    }

    // 2) freeOverride permanente (TV grátis no combo) — não conta após promo.
    if (it.freeOverride) return acc;

    // 3) promoMonths do plano (ex: 100 MEGA: 3 meses).
    const promoM = Number((it.plan as any).promoMonths) || 0;
    const promoActive = promoM > 0 && hasOriginal;
    if (promoActive && promoM > promoMonthsMax) promoMonthsMax = promoM;
    const after = promoActive
      ? (it.plan.originalPriceCents as number)
      : getChargedUnitPriceCents(it);
    return acc + after * it.qty;
  }, 0);
  const hasPromo = promoMonthsMax > 0 && afterPromoTotalCents !== totalCents;

  return {
    summaryItems,
    subtotalCents,
    comboDiscountCents: 0,
    totalCents,
    afterPromoTotalCents,
    hasMobilePromo: false,
    fiberCardPromo: false,
    hasPromo,
    cheapestTvPlan: null,
    hasFiberInCart: items.some((i) => i.plan.category === "fibra"),
    hasVozInCart: false,
    tvFreeByFiber: hasQualifyingFiber,
    mobileCheapestFreeByFiber: false,
    mobileUsesComboPrice: false,
    fiberQualifiesPromo: false,
    mobileBlack4GBFreeByFiber: false,
    promoMonths: hasPromo ? promoMonthsMax : 0,
    afterPromoMonth: hasPromo ? promoMonthsMax + 1 : 0,
  };
}
