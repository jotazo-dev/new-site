import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, ShoppingBag, Sparkles, ArrowRight, Wifi, Smartphone, Tv, Gift, ChevronRight, Check, Tag, Database, ArrowLeftRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

import { SvaRemoveDialog } from "@/components/shop/SvaRemoveDialog";
import { FiberRemoveDialog } from "@/components/shop/FiberRemoveDialog";
import { ChipRemoveDialog } from "@/components/shop/ChipRemoveDialog";
import { SwapPlanSheet } from "@/components/shop/SwapPlanSheet";
import { markSvaManuallyRemoved } from "@/cart/svaManualRemoval";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, COMBO_COUPON_CODE } from "@/cart/CartContext";
import { sortCartItemsForDisplay } from "@/cart/sortItems";
import { formatBRL } from "@/data/plans";
import { usePlans } from "@/hooks/usePlans";
import { useMetaEvents } from "@/hooks/useMetaEvents";
import { cn } from "@/lib/utils";
import { playSuccessSound, playGiftSound } from "@/lib/sounds";
import type { Plan } from "@/data/plans";
import { computeCartTotals, getSubtotalUnitPriceCents, isQualifyingFiberForFreeTv } from "@/cart/pricing";
import { isChipBannerGift } from "@/cart/mobileChipBannerGift";

const CATEGORY_LABELS: Record<string, string> = {
  fibra: "Internet Fibra",
  movel: "Móvel 5G",
  tv: "TV",
};

function UpgradeCelebrationToast({
  fromName,
  toName,
  onClose,
}: {
  fromName?: string;
  toName: string;
  onClose: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto relative w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-br from-primary via-primary to-accent p-5 text-primary-foreground shadow-2xl shadow-accent/30 animate-scale-in"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/40 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" aria-hidden />

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }}
        aria-label="Fechar"
        className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white/90 transition hover:bg-white/25 cursor-pointer"
      >
        <span className="text-xs">✕</span>
      </button>

      <div className="relative flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-white shadow-inner ring-2 ring-white/30 animate-bounce">
          <Gift className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1 pr-6">
          <div className="text-lg font-extrabold leading-tight">
            🎉 Upgrade realizado!
          </div>
          <p className="mt-1.5 text-sm leading-snug text-white/90">
            {fromName ? (
              <>
                Você trocou <strong>{fromName}</strong> por{" "}
                <strong>{toName}</strong> e desbloqueou <strong>Pacote Jotazo TV com +100 canais</strong>.
              </>
            ) : (
              <>
                Plano alterado para <strong>{toName}</strong> e você desbloqueou <strong>Pacote Jotazo TV com +100 canais</strong>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}


const CATEGORY_ICON: Record<string, typeof Wifi> = {
  fibra: Wifi,
  movel: Smartphone,
  tv: Tv,
};

const CATEGORY_STYLE: Record<string, string> = {
  fibra: "bg-primary/10 text-primary",
  movel: "bg-[#25D366]/10 text-[#25D366]",
  tv: "bg-accent/10 text-accent",
};

export function CartDrawerBody({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { items, totalCents, remove, clear, add, count, setQty } = useCart();
  const { trackEvent } = useMetaEvents();
  const { data: allPlans = [] } = usePlans();
  const navigate = useNavigate();
  
  const [svaRemoveConfirmId, setSvaRemoveConfirmId] = React.useState<string | null>(null);
  const [fiberRemoveConfirmOpen, setFiberRemoveConfirmOpen] = React.useState(false);
  const [chipRemoveConfirmOpen, setChipRemoveConfirmOpen] = React.useState(false);

  const handleAddWithTracking = React.useCallback(
    (plan: Plan) => {
      add(plan);
      trackEvent("AddToCart", {
        content_ids: [plan.id],
        content_name: plan.name,
        value: plan.priceCents / 100,
        currency: "BRL",
      });
    },
    [add, trackEvent]
  );

  const handleCheckout = React.useCallback(() => {
    trackEvent("InitiateCheckout", {
      value: totalCents / 100,
      currency: "BRL",
      content_ids: items.map((i) => i.plan.id),
      num_items: count,
    });
    const first = items[0]?.plan.category;
    const focus = first === "fibra" || first === "movel" || first === "tv" ? first : "fibra";
    onNavigate?.();
    navigate("/personalize-seu-combo", { state: { focusCategory: focus } });
  }, [trackEvent, totalCents, items, count, navigate, onNavigate]);

  const currentIds = React.useMemo(() => new Set(items.map((i) => i.plan.id)), [items]);
  const upsell = React.useMemo(
    () =>
      allPlans
        .filter((p) => (p as any).type === "upsell" && !currentIds.has(p.id))
        .slice(0, 3),
    [allPlans, currentIds]
  );


  // Single source of truth for pricing/totals/promos (mirrors /personalize-seu-combo).
  const totals = React.useMemo(() => computeCartTotals(items, allPlans), [items, allPlans]);

  // Carrinho contém apenas Chip 5G (sem fibra/TV) — usado para mostrar diálogo
  // de retenção focado nos benefícios do Chip 5G Black da Jotazo.
  const onlyChipInCart = React.useMemo(() => {
    if (items.length === 0) return false;
    const hasFiber = items.some((i) => i.plan.category === "fibra");
    const hasTv = items.some((i) => i.plan.category === "tv");
    if (hasFiber || hasTv) return false;
    return items.some(
      (i) =>
        i.plan.category === "movel" &&
        (i.plan as any).type !== "voz" &&
        (i.plan as any).type !== "sva" &&
        (i.plan as any).type !== "upsell",
    );
  }, [items]);

  const firstChipPlan = React.useMemo(
    () =>
      items.find(
        (i) =>
          i.plan.category === "movel" &&
          (i.plan as any).type !== "voz" &&
          (i.plan as any).type !== "sva" &&
          (i.plan as any).type !== "upsell",
      )?.plan,
    [items],
  );
  const {
    summaryItems,
    comboDiscountCents,
    totalCents: finalTotalCents,
    afterPromoTotalCents,
    hasMobilePromo,
    hasPromo,
    cheapestTvPlan,
    hasFiberInCart,
    tvFreeByFiber,
    promoMonths,
    afterPromoMonth,
  } = totals;

  // Map summaryItems by plan id for lookup while rendering the drawer cards.
  // The drawer keeps its own visual layout but PRICING/labels/free flags
  // come from computeCartTotals — guaranteeing zero divergence with the
  // /personalize-seu-combo Resumo do pedido.
  const summaryById = React.useMemo(() => {
    const m = new Map<string, typeof summaryItems[number]>();
    for (const s of summaryItems) m.set(s.plan.id, s);
    return m;
  }, [summaryItems]);

  const selectedFiber = React.useMemo(
    () => items.find((i) => i.plan.category === "fibra")?.plan,
    [items],
  );
  const selectedMobile = React.useMemo(
    () => items.find((i) => i.plan.category === "movel" && (i.plan as any).type !== "voz" && (i.plan as any).type !== "sva" && (i.plan as any).type !== "upsell")?.plan,
    [items],
  );

  // Cheapest mobile per chip type (for "free" badge)
  const cheapestMobileIds = React.useMemo(() => {
    const mobilePlans = allPlans.filter((p) => p.category === "movel" && (p as any).type !== "upsell");
    const map = new Map<string, Plan>();
    for (const p of mobilePlans) {
      const chip = (p as any).chipType || "5g";
      const cur = map.get(chip);
      if (!cur || p.priceCents < cur.priceCents) map.set(chip, p);
    }
    return new Set(Array.from(map.values()).map((p) => p.id));
  }, [allPlans]);
  const isCheapestMobile = (p?: Plan) => !!p && cheapestMobileIds.has(p.id);

  // Detectar se está perto do limite para sugerir upgrade
  const fiberSpeed = React.useMemo(() => {
    if (!selectedFiber) return 0;
    return parseInt(selectedFiber.name.replace(/\D/g, ""), 10) || 0;
  }, [selectedFiber]);

  const isCloseToTvThreshold = !!selectedFiber && fiberSpeed > 0 && fiberSpeed < 500 && fiberSpeed >= 200;
  const isCloseToMobileThreshold = !!selectedFiber && !isQualifyingFiberForFreeTv(selectedFiber) && selectedFiber.priceCents >= 6990;

  const nextFiberForTv = React.useMemo(() => {
    if (!isCloseToTvThreshold) return null;
    const candidates = allPlans
      .filter((p) => p.category === "fibra" && (p as any).type !== "upsell" && parseInt(p.name.replace(/\D/g, ""), 10) >= 500)
      .sort((a, b) => parseInt(a.name.replace(/\D/g, ""), 10) - parseInt(b.name.replace(/\D/g, ""), 10));
    return candidates[0] || null;
  }, [allPlans, isCloseToTvThreshold]);

  const nextFiberForMobile = React.useMemo(() => {
    if (!isCloseToMobileThreshold) return null;
    const candidates = allPlans
      .filter((p) =>
        p.category === "fibra" &&
        (p as any).type !== "upsell" &&
        isQualifyingFiberForFreeTv(p) &&
        parseInt(p.name.replace(/\D/g, ""), 10) >= fiberSpeed
      )
      .sort((a, b) => parseInt(a.name.replace(/\D/g, ""), 10) - parseInt(b.name.replace(/\D/g, ""), 10));
    return candidates[0] || null;
  }, [allPlans, isCloseToMobileThreshold, fiberSpeed]);


  // Free flag SOMENTE via summaryItems (single source of truth = computeCartTotals).
  const isFreeOverride = React.useCallback(
    (plan: Plan) => summaryById.get(plan.id)?.freeOverride === true,
    [summaryById],
  );

  // Para o Subtotal: usa a mesma regra compartilhada por Carrinho e Resumo.
  const getSubtotalUnitPrice = React.useCallback((plan: Plan): number => {
    const summary = summaryById.get(plan.id);
    return getSubtotalUnitPriceCents(summary ?? { plan, qty: 1 });
  }, [summaryById]);


  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-auto px-4 pb-6 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" aria-hidden />
              <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary/15 to-accent/15 ring-1 ring-border">
                <ShoppingBag className="h-9 w-9 text-primary" />
              </div>
            </div>
            <div className="text-base font-semibold text-foreground">Seu carrinho está vazio</div>
            <div className="mt-1 max-w-[260px] text-sm text-muted-foreground">
              Monte seu combo personalizado e aproveite descontos exclusivos.
            </div>
            <Button asChild className="mt-5 rounded-full px-6 font-semibold">
              <a href="/personalize-seu-combo">
                Montar meu combo
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2.5">
              {(() => {
                const sorted = sortCartItemsForDisplay(items);
                return sorted.map((it) => {
                const catLabel = CATEGORY_LABELS[it.plan.category] ?? it.plan.category;
                const Icon = CATEGORY_ICON[it.plan.category] ?? ShoppingBag;
                const iconStyle = CATEGORY_STYLE[it.plan.category] ?? "bg-muted text-foreground";
                const isVoz = false;
                const original = it.plan.originalPriceCents ?? 0;
                const isTvStandalone = it.plan.category === "tv" && (it.plan as any).type !== "sva" && !hasFiberInCart && cheapestTvPlan?.id !== it.plan.id;
                const hasDiscount = original > 0 && original > it.plan.priceCents && !isTvStandalone;
                const discountPct = hasDiscount
                  ? Math.round(((original - it.plan.priceCents) / original) * 100)
                  : 0;
                const summaryItem = summaryById.get(it.plan.id);
                const isFree = summaryItem?.freeOverride === true;
                const freeLabel = summaryItem?.freeConditionText ?? "Grátis";
                return (
                  <div
                    key={it.plan.id}
                    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5 shadow-sm transition-all duration-300 animate-fade-in hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconStyle)}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              {catLabel}
                            </span>
                            {isFree ? (
                              <span className="inline-flex items-center rounded-full bg-[hsl(142,70%,40%)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[hsl(142,70%,30%)]">
                                🎁 Grátis
                              </span>
                            ) : hasDiscount ? (
                              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                                -{discountPct}%
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1.5 truncate text-sm font-bold text-foreground">
                            {it.plan.name}
                          </div>
                          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                            {isFree ? (
                              <>
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatBRL(it.plan.priceCents)}
                                </span>
                                <span className="text-lg font-extrabold text-[hsl(142,70%,40%)]">Grátis</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {it.plan.category === "tv" && selectedFiber
                                    ? `+ de 100 Canais grátis no plano ${selectedFiber.name}`
                                    : freeLabel}
                                </span>
                                {it.qty > 1 && (
                                  <span className="ml-1 text-[11px] font-semibold text-primary/70">
                                    + {it.qty - 1} × {formatBRL(it.plan.priceCents)} = {formatBRL((it.qty - 1) * it.plan.priceCents)}/mês
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                {(() => {
                                  // UNIFICAÇÃO: mesma lógica do OrderSummaryPanel (/personalize-seu-combo)
                                  // para garantir consistência entre carrinho e resumo do pedido.
                                  const summary = summaryById.get(it.plan.id);
                                  const plan = summary?.plan ?? it.plan;
                                  const q = it.qty;
                                  const t = (plan as any).type;
                                  const hasOriginal =
                                    !!plan.originalPriceCents &&
                                    plan.originalPriceCents > plan.priceCents;
                                  const hasMobileInItems = items.some(
                                    (i) =>
                                      i.plan.category === "movel" &&
                                      (i.plan as any).type !== "sva" &&
                                      (i.plan as any).type !== "voz" &&
                                      (i.plan as any).type !== "upsell",
                                  );
                                  const comboCompleto =
                                    hasFiberInCart &&
                                    hasMobileInItems &&
                                    items.some((i) => i.plan.category === "tv" && (i.plan as any).type !== "sva");

                                  const renderPrice = (
                                    strikeCents: number | null,
                                    mainCents: number,
                                    mainClass: string,
                                    suffix?: React.ReactNode,
                                  ) => (
                                    <>
                                      {strikeCents != null && (
                                        <span className="text-xs text-muted-foreground line-through">
                                          {formatBRL(strikeCents)}
                                        </span>
                                      )}
                                      <span className={cn("text-lg font-extrabold", mainClass)}>
                                        {formatBRL(mainCents)}
                                      </span>
                                      <span className="text-[11px] text-muted-foreground">/mês</span>
                                      {suffix}
                                      {q > 1 && (
                                        <span className="ml-1 text-[11px] font-semibold text-primary/70">
                                          × {q} = {formatBRL(mainCents * q)}/mês
                                        </span>
                                      )}
                                    </>
                                  );

                                  // Caso 2: comboPriceCents explícito
                                  if (summary?.comboPriceCents != null && summary.comboPriceCents > 0) {
                                    return renderPrice(
                                      plan.priceCents,
                                      summary.comboPriceCents,
                                      "text-[hsl(142,70%,40%)]",
                                      <span className="text-[10px] font-semibold text-[hsl(142,70%,30%)]">Combo</span>,
                                    );
                                  }

                                  // Caso 3: Chip 5G SOZINHO (sem fibra)
                                  const isChipStandalone =
                                    plan.category === "movel" &&
                                    t !== "sva" && t !== "voz" && t !== "upsell" &&
                                    !hasFiberInCart && hasOriginal;
                                  if (isChipStandalone) {
                                    return (
                                      <>
                                        {renderPrice(null, plan.originalPriceCents!, "text-primary")}
                                        <div className="w-full mt-1 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                          <Sparkles className="h-3 w-3" />
                                          {formatBRL(plan.priceCents)}/mês no combo com Internet Fibra
                                        </div>
                                      </>
                                    );
                                  }

                                  // Caso 3b: Chip com Fibra mas SEM combo completo (sem TV)
                                  const isChipFiberOnly =
                                    plan.category === "movel" &&
                                    t !== "sva" && t !== "voz" && t !== "upsell" &&
                                    hasFiberInCart && !comboCompleto && hasOriginal;
                                  if (isChipFiberOnly) {
                                    return (
                                      <>
                                        {renderPrice(null, plan.originalPriceCents!, "text-primary")}
                                        <div className="w-full mt-1 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                          <Sparkles className="h-3 w-3" />
                                          Adicione TV para liberar o desconto de combo
                                        </div>
                                      </>
                                    );
                                  }

                                  // Caso 4: Combo discount (fibra ou chip em combo completo)
                                  if (summary?.comboDiscount && plan.originalPriceCents) {
                                    const promoM = Number((plan as any).promoMonths) || 0;
                                    return renderPrice(
                                      plan.originalPriceCents,
                                      plan.priceCents,
                                      "text-[hsl(142,70%,40%)]",
                                      <>
                                        <span className="text-[10px] font-semibold text-[hsl(142,70%,30%)]">Combo</span>
                                        {promoM > 0 && comboCompleto && (
                                          <div className="w-full mt-1 inline-flex items-center gap-1 rounded-md bg-[hsl(142,70%,40%)]/10 px-2 py-0.5 text-[10px] font-semibold text-[hsl(142,70%,30%)]">
                                            <Sparkles className="h-3 w-3" />
                                            {promoM} primeiros meses · depois {formatBRL(plan.originalPriceCents!)}/mês
                                          </div>
                                        )}
                                      </>,
                                    );
                                  }

                                  // Caso 5: TV em combo (não-SVA, com fibra)
                                  if (plan.category === "tv" && t !== "sva" && hasFiberInCart && hasOriginal) {
                                    return renderPrice(
                                      plan.originalPriceCents!,
                                      plan.priceCents,
                                      "text-[hsl(142,70%,40%)]",
                                      <span className="text-[10px] font-semibold text-[hsl(142,70%,30%)]">Combo</span>,
                                    );
                                  }

                                  // Caso 5b: TV avulsa (sem fibra)
                                  if (plan.category === "tv" && t !== "sva" && !hasFiberInCart) {
                                    return (
                                      <>
                                        {renderPrice(null, plan.priceCents, "text-primary")}
                                        <div className="w-full mt-0.5 text-[10px] text-muted-foreground">
                                          Avulso. Adicione Internet Fibra para o preço promocional do combo.
                                        </div>
                                      </>
                                    );
                                  }

                                  // Caso 6: Fibra sem combo — valor cheio (originalPriceCents) sem riscado
                                  if (plan.category === "fibra" && hasOriginal) {
                                    return renderPrice(null, plan.originalPriceCents!, "text-primary");
                                  }

                                  // Caso 7 (padrão): preço normal com riscado opcional
                                  return renderPrice(
                                    hasOriginal ? plan.originalPriceCents! : null,
                                    plan.priceCents,
                                    "text-primary",
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {(() => {
                        // Regra do combo: quando há fibra (modo combo), só a fibra pode ser removida.
                        // Os demais itens (móvel, TV, SVAs, voz) ficam atrelados à fibra.
                        // Remover a fibra limpa o carrinho inteiro.
                        if (isVoz) return null;
                        const isFiber = it.plan.category === "fibra";
                        const isSwappableMobile =
                          it.plan.category === "movel" &&
                          (it.plan as any).type !== "sva" &&
                          (it.plan as any).type !== "voz" &&
                          (it.plan as any).type !== "upsell";
                        const swapOptions = isSwappableMobile
                          ? allPlans.filter(
                              (p) =>
                                p.category === "movel" &&
                                (p as any).type !== "sva" &&
                                (p as any).type !== "voz" &&
                                (p as any).type !== "upsell" &&
                                (((p as any).chipType ?? "5g") === ((it.plan as any).chipType ?? "5g")),
                            )
                          : [];
                        // Chip 5G adicionado pelo card (não banner) pode ser removido individualmente, mesmo em combo.
                        const isMobileFromCard = isSwappableMobile && !isChipBannerGift(it.plan.id);
                        const showRemove = isFiber || !hasFiberInCart || isMobileFromCard;
                        if (!showRemove && !isSwappableMobile) return null;
                        return (
                          <div className="flex shrink-0 items-center gap-1">
                            {isSwappableMobile && (
                              <SwapPlanSheet
                                currentPlan={it.plan}
                                currentQty={it.qty}
                                options={swapOptions}
                              />
                            )}
                            {showRemove && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (isFiber && hasFiberInCart) {
                                    setFiberRemoveConfirmOpen(true);
                                    return;
                                  }
                                  // Se é o único chip 5G no carrinho (sem fibra/TV), abre retenção
                                  if (isSwappableMobile && onlyChipInCart) {
                                    setChipRemoveConfirmOpen(true);
                                    return;
                                  }
                                  if ((it.plan as any).type === "sva") {
                                    setSvaRemoveConfirmId(it.plan.id);
                                  } else {
                                    remove(it.plan.id);
                                  }
                                }}
                                aria-label={`Remover ${it.plan.name} do carrinho`}
                                className="h-8 w-8 rounded-full text-muted-foreground opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {it.plan.category === "movel" && (it.plan as any).type !== "sva" && (it.plan as any).type !== "voz" && (it.plan as any).type !== "upsell" && (
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground">Qtd. de chips</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => setQty(it.plan.id, Math.max(1, it.qty - 1))}
                            disabled={it.qty <= 1}
                            aria-label="Diminuir quantidade"
                          >
                            −
                          </Button>
                          <span className="min-w-[1.25rem] text-center text-sm font-bold tabular-nums">{it.qty}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => setQty(it.plan.id, it.qty + 1)}
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
                });
              })()}
            </div>
            
            {/* Aviso de upgrade próximo ao limite */}
            {isCloseToTvThreshold && nextFiberForTv && (
              <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-4">
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/20 blur-2xl" aria-hidden />
                <div className="relative flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
                    <Gift className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">
                      Quase lá! Desbloqueie benefícios grátis 🎁
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {nextFiberForTv && (
                        <>
                          Upgrade para <strong>{nextFiberForTv.name}</strong> e ganhe TV com + de 100 canais grátis no combo!
                          <br />
                          <span className="text-[11px] text-muted-foreground/70">
                            A partir de {formatBRL(nextFiberForTv.priceCents)}/mês
                          </span>
                        </>
                      )}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 rounded-lg px-2 text-xs font-semibold text-accent hover:bg-accent/10 hover:text-foreground"
                      onClick={() => {
                        const targetPlan = nextFiberForTv;
                        if (targetPlan) {
                          const previousName = selectedFiber?.name;
                          // Som de "gift" animado
                          playGiftSound();
                          // Substituir fibra atual pela do upgrade
                          if (selectedFiber) remove(selectedFiber.id);
                          add(targetPlan);
                          // Confete celebratório (lazy import)
                          import("canvas-confetti").then(({ default: confetti }) => {
                            confetti({
                              particleCount: 140,
                              spread: 90,
                              startVelocity: 45,
                              origin: { x: 0.5, y: 0.2 },
                              colors: ["#fb923c", "#1e88e5", "#25D366", "#ffffff", "#fbbf24"],
                              zIndex: 100000,
                            });
                          });
                          // Toast central comemorativo
                          toast.custom(
                            (id) => (
                              <UpgradeCelebrationToast
                                fromName={previousName}
                                toName={targetPlan.name}
                                onClose={() => toast.dismiss(id)}
                              />
                            ),
                            { position: "top-center", duration: 8000, unstyled: true, classNames: { toast: "!bg-transparent !border-0 !shadow-none !p-0" } }
                          );
                        }
                      }}
                    >
                      Fazer upgrade agora
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedFiber && !selectedMobile && (() => {
              const savings = (selectedFiber.originalPriceCents ?? 0) > selectedFiber.priceCents
                ? selectedFiber.originalPriceCents! - selectedFiber.priceCents
                : 0;
              const suggestedChip = allPlans
                .filter((p) => p.category === "movel" && (p as any).type !== "upsell" && (p as any).type !== "voz" && (p as any).type !== "sva")
                .sort((a, b) => a.priceCents - b.priceCents)[0];
              return (
                <div className="relative overflow-hidden rounded-2xl border border-[#25D366]/30 bg-gradient-to-br from-[#25D366]/10 via-card to-card p-4">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#25D366]/25 blur-3xl" aria-hidden />
                  <div className="pointer-events-none absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-primary/15 blur-3xl" aria-hidden />
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md shadow-[#25D366]/30">
                        <Smartphone className="h-3.5 w-3.5" />
                      </span>
                      <div className="text-sm font-extrabold tracking-tight text-foreground">
                        Falta o seu Chip 5G 🚀
                      </div>
                    </div>

                    <p className="mt-2 text-xs leading-snug text-muted-foreground">
                      Você sempre conectado: junte um <strong className="text-foreground">Chip 5G Jotazo</strong> e tenha internet veloz em casa <em>e</em> fora dela, tudo em uma só conta.
                    </p>

                    <ul className="mt-3 grid gap-1.5 text-xs text-foreground/90">
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(142,70%,30%)]" />
                        <span>5G ilimitado para WhatsApp</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(142,70%,30%)]" />
                        <span>Cobertura Nacional</span>
                      </li>
                    </ul>

                    {suggestedChip && (
                      <Button
                        size="sm"
                        onClick={() => handleAddWithTracking(suggestedChip)}
                        className="mt-3 h-9 w-full rounded-xl bg-[#25D366] text-white shadow-md shadow-[#25D366]/30 hover:bg-[#1fb858]"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar {suggestedChip.name} por {formatBRL(suggestedChip.priceCents)}/mês
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}


            {upsell.length ? (
              <section className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 via-card to-card p-4">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-foreground">🚀 Turbine sua Internet</div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Adicionais selecionados pra você.
                  </p>

                  <div className="mt-3 grid gap-2">
                    {upsell.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/80 p-3 backdrop-blur transition-colors hover:border-accent/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {p.name}
                          </div>
                          <div className="mt-0.5 text-xs font-medium text-accent">
                            + {formatBRL(p.priceCents)}/mês
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddWithTracking(p)}
                          className="h-8 shrink-0 rounded-full border-accent/40 px-3 text-xs font-semibold text-accent hover:bg-accent hover:text-accent-foreground"
                          aria-label={`Adicionar ${p.name} ao carrinho`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <button
              type="button"
              onClick={() => {
                if (hasFiberInCart) {
                  setFiberRemoveConfirmOpen(true);
                  return;
                }
                if (onlyChipInCart) {
                  setChipRemoveConfirmOpen(true);
                  return;
                }
                clear();
              }}
              className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline"
            >
              <Trash2 className="h-3 w-3" />
              Limpar carrinho
            </button>
          </div>
        )}
      </div>

      {items.length ? (
        <div className="border-t border-border/60 bg-card/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{count} {count === 1 ? "item" : "itens"} no pedido</span>
              {(() => {
                const subtotalNoDiscount = items.reduce((acc, it) => {
                  const q = it.qty ?? 1;
                  return acc + getSubtotalUnitPrice(it.plan) * q;
                }, 0);
                const hasPromoPeriod = hasPromo && finalTotalCents !== afterPromoTotalCents && (promoMonths ?? 0) > 0;
                const pMonths = Math.min(12, Math.max(0, promoMonths ?? 0));
                const annualCost = hasPromoPeriod
                  ? finalTotalCents * pMonths + afterPromoTotalCents * (12 - pMonths)
                  : finalTotalCents * 12;
                const savingsAnnual = Math.max(0, subtotalNoDiscount * 12 - annualCost);
                return savingsAnnual > 0 ? (
                  <span className="text-sm font-semibold text-[hsl(142,70%,40%)]">
                    (Economize {formatBRL(savingsAnnual)} por ano)
                  </span>
                ) : null;
              })()}
            </div>

            {comboDiscountCents > 0 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Desconto combo</span>
                  <span className="font-semibold text-[hsl(142,70%,40%)]">
                    - {formatBRL(comboDiscountCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
                    <Check className="h-3.5 w-3.5" />
                    {COMBO_COUPON_CODE}
                  </span>
                  <span className="text-[10px] font-medium text-success">Aplicado</span>
                </div>
              </>
            )}

            {hasPromo && finalTotalCents !== afterPromoTotalCents && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" />
                  Condições da promoção
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{promoMonths} primeiros meses</span>
                  <span className="font-bold text-[hsl(142,70%,40%)]">{formatBRL(finalTotalCents)}/mês</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">A partir do {afterPromoMonth}º mês</span>
                  <span className="font-semibold text-foreground">{formatBRL(afterPromoTotalCents)}/mês</span>
                </div>
              </div>
            )}

            <Separator />

            {(() => {
              // Subtotal = soma dos preços originais (sem desconto)
              const subtotalNoDiscount = items.reduce((acc, it) => {
                const q = it.qty ?? 1;
                return acc + getSubtotalUnitPrice(it.plan) * q;
              }, 0);
              const hasDiscount = subtotalNoDiscount > finalTotalCents;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-muted-foreground">Subtotal</div>
                    <span className={cn("text-sm text-muted-foreground", hasDiscount && "line-through")}>
                      {formatBRL(subtotalNoDiscount)}/mês
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-base font-semibold text-foreground">
                      {hasFiberInCart && items.some((i) => i.plan.category === "movel") ? "Total no combo:" : "Total"}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-[hsl(142,70%,40%)]">
                        {formatBRL(finalTotalCents)}
                      </span>
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>
                  </div>
                </>
              );
            })()}

            <Button
              size="lg"
              className={cn(
                "w-full rounded-xl font-bold shadow-lg shadow-primary/20",
                "bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary/80",
              )}
              onClick={handleCheckout}
            >
              Finalizar pedido
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>

            <p className="text-center text-[11px] leading-snug text-muted-foreground">
              Você poderá revisar e personalizar seu combo antes de finalizar.
            </p>
          </div>
        </div>
      ) : null}
      <SvaRemoveDialog
        open={!!svaRemoveConfirmId}
        onOpenChange={(open) => !open && setSvaRemoveConfirmId(null)}
        onConfirm={() => {
          if (svaRemoveConfirmId) {
            markSvaManuallyRemoved(selectedFiber?.id ?? null);
            remove(svaRemoveConfirmId);
            setSvaRemoveConfirmId(null);
          }
        }}
      />
      <FiberRemoveDialog
        open={fiberRemoveConfirmOpen}
        onOpenChange={setFiberRemoveConfirmOpen}
        fiberName={selectedFiber?.name}
        cartContext={{
          hasTv: items.some((i) => i.plan.category === "tv"),
          hasMobile: items.some((i) => i.plan.category === "movel" && (i.plan as any).type !== "voz" && (i.plan as any).type !== "sva"),
          mobileQty: items
            .filter((i) => i.plan.category === "movel" && (i.plan as any).type !== "voz" && (i.plan as any).type !== "sva")
            .reduce((acc, i) => acc + i.qty, 0),
          hasBlackChip: items.some((i) => i.plan.category === "movel" && (i.plan as any).chipType === "black"),
          svaNames: items.filter((i) => (i.plan as any).type === "sva").map((i) => i.plan.name),
          fiberSpeedLabel: selectedFiber?.name,
          totalMonthlyBRL: formatBRL(finalTotalCents),
        }}
        onConfirm={() => {
          clear();
          setFiberRemoveConfirmOpen(false);
        }}
        onChangePlan={() => {
          setFiberRemoveConfirmOpen(false);
          onNavigate?.();
          navigate("/personalize-seu-combo", { state: { focusCategory: "fibra" } });
        }}
      />
      <ChipRemoveDialog
        open={chipRemoveConfirmOpen}
        onOpenChange={setChipRemoveConfirmOpen}
        chipName={firstChipPlan?.name}
        chipPlan={firstChipPlan}
        onConfirm={() => {
          clear();
          setChipRemoveConfirmOpen(false);
        }}
      />
    </div>
  );
}
