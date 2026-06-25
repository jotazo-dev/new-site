import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCart } from "@/cart/CartContext";
import { type Plan, formatBRL } from "@/data/plans";
import { PlanIncludeIcon } from "@/components/shop/PlanIncludeIcon";
import { getPlanAccent } from "@/lib/planAccent";
import { ListVideo } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { markMobile4gFreeManuallyRemoved } from "@/cart/mobile4gFreeManualRemoval";

function isBestOffer(plan: Plan) {
  return plan.badges?.includes("Oferta") ?? false;
}

function isTopPick(plan: Plan) {
  return plan.badges?.includes("Mais vendido") || plan.badges?.includes("Melhor custo-benefício");
}

interface PremiumPlanCardProps {
  plan: Plan;
  allPlans: Plan[];
  isSelected?: boolean;
  onSelect?: (planId: string | null) => void;
  redirectOnSelect?: boolean;
  /** Callback fired after plan is added when redirectOnSelect is true */
  onPlanAdded?: (plan: Plan) => void;
  /** When true, renders price as struck-through with a "Grátis" label */
  freeOverride?: boolean;
  /** Lighter render for use inside mobile sliders/configurators */
  compact?: boolean;
  /** Optional badge rendered at the top-right corner */
  topRightBadge?: { label: string; icon?: React.ReactNode };
  /** Premium dark styling for Black-tier plans */
  isBlackCard?: boolean;
}

export const PremiumPlanCard = React.memo(function PremiumPlanCard({ plan, allPlans, isSelected = false, onSelect, redirectOnSelect = false, onPlanAdded, freeOverride = false, compact = false, topRightBadge, isBlackCard = false }: PremiumPlanCardProps) {
  const { add, remove, items, setQty } = useCart();
  const navigate = useNavigate();
  const bestOffer = isBestOffer(plan);
  const topPick = isTopPick(plan);
  const accent = getPlanAccent(plan.accentColor);
  const hasAccent = !!accent.value;

  const SINGLE_CATEGORIES = ["fibra", "movel", "tv"];
  const isSvaOrUpsell = (plan as any).type === "sva" || (plan as any).type === "upsell";
  const willReplaceSameCategory =
    !isSelected &&
    !isSvaOrUpsell &&
    SINGLE_CATEGORIES.includes(plan.category) &&
    items.some((i) => i.plan.category === plan.category && i.plan.id !== plan.id && (i.plan as any).type !== "sva");

  const bumpPlans: Plan[] = [];
  const showBumps = false;

  const [bumpSelectedId, setBumpSelectedId] = React.useState<string | null>(null);
  const [gradeOpen, setGradeOpen] = React.useState(false);
  const isTvPlan = plan.category === "tv" && (plan as any).type !== "sva";
  const hasGrade = isTvPlan && !!plan.logoUrl;

  const handleAdd = React.useCallback((opts?: { skipSelect?: boolean }) => {
    if (isSelected) {
      remove(plan.id);
      onSelect?.(null as any);
      return;
    }

    // Sempre adiciona a versão "canônica" do plano (do catálogo) — assim o carrinho
    // preserva priceCents/originalPriceCents reais e os totais são recalculados
    // dinamicamente conforme o estado do combo (avulso vs combo).
    const canonical = allPlans.find((p) => p.id === plan.id) ?? plan;

    // Quando o plano de fibra é adicionado pelo card, NÃO oferece o chip 5G grátis
    // (apenas TV grátis se aplicável). A flag de "manual removed" bloqueia o
    // auto-add do Black 4GB e o popup de Parabéns dentro do useCartAutoSync.
    if (plan.category === "fibra" && (plan as any).type !== "sva") {
      markMobile4gFreeManuallyRemoved(plan.id);
    }

    add(canonical);

    if (plan.category === "movel") {
      window.dispatchEvent(new Event("cart:open"));
    }

    if (bumpSelectedId) {
      const bump = bumpPlans.find((b) => b.id === bumpSelectedId);
      if (bump) add(bump);
    }

    setBumpSelectedId(null);
    // skipSelect: quando o usuário usa "+ Adicionar ao pedido" para empilhar
    // outro chip 5G, não queremos que o onSelect do parent remova o chip atual.
    if (!opts?.skipSelect) {
      onSelect?.(plan.id);
    }

    onPlanAdded?.(plan);

    if (redirectOnSelect && !onPlanAdded) {
      const cat = plan.category;
      const targetCat = cat === "fibra" || cat === "movel" || cat === "tv" ? cat : "fibra";
      navigate("/personalize-seu-combo", { state: { focusCategory: targetCat } });
    }
  }, [add, remove, bumpPlans, bumpSelectedId, plan, allPlans, isSelected, onSelect, redirectOnSelect, onPlanAdded, navigate]);

  const handleBumpToggle = (id: string) => {
    setBumpSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border bg-card w-full min-w-0 max-w-full",
        compact ? "transition-colors" : "transition-all duration-300 hover:-translate-y-1 will-change-transform",
        isSelected
          ? "border-[#25D366] ring-2 ring-[#25D366] shadow-lg"
          : hasAccent
              ? cn(accent.border, "shadow-lg")
              : bestOffer
                ? "ring-1 ring-accent shadow-lg"
                : "shadow-sm",
      )}
    >
      {(bestOffer || hasAccent) ? (
        <div className="absolute left-0 right-0 top-0 z-10">
          <div className={cn(
            "mx-auto w-fit rounded-b-xl px-4 py-1 text-xs font-semibold",
            hasAccent ? accent.badge : "bg-accent text-accent-foreground",
          )}>
            {plan.accentLabel || "MELHOR OFERTA"}
          </div>
        </div>
      ) : null}

      {topRightBadge && (
        <div className={cn(
          "absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm",
          "border-primary/20 bg-primary/10 text-primary",
        )}>
          {topRightBadge.icon}
          <span>{topRightBadge.label}</span>
        </div>
      )}

      <CardHeader className={cn(compact ? "pb-2 px-4" : "pb-3", !isBlackCard ? "pt-10" : compact ? "pt-4" : "pt-6")}>
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {topPick ? <Badge variant="secondary">Destaque</Badge> : null}
          {plan.badges?.map((b) => (
            <Badge key={b} variant={b === "Oferta" ? "secondary" : "default"}>
              {b}
            </Badge>
          ))}
        </div>

        {plan.logoUrl && !hasGrade ? (
          <div className="mt-2 flex flex-col items-start gap-2">
            <img src={plan.logoUrl} alt={plan.name} className="h-16 w-auto max-w-[180px] rounded-[10px] object-contain" />
            <CardTitle className={cn("font-bold tracking-tight break-words leading-tight min-w-0", compact ? "text-xl" : "text-2xl")}>{plan.name}</CardTitle>
          </div>
        ) : (
          <CardTitle className={cn("mt-2 font-bold tracking-tight break-words leading-tight min-w-0", compact ? "text-xl" : "text-3xl md:text-4xl")}>{plan.name}</CardTitle>
        )}
        {plan.description && (
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
        )}
        {hasGrade && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setGradeOpen(true); }}
            aria-label={`Ver grade de canais do ${plan.name}`}
            className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ListVideo className="h-3.5 w-3.5" />
            Canais
          </button>
        )}

        <div className={cn("grid gap-2", compact ? "mt-2" : "mt-3")}>
          {plan.category === "movel" && ((plan.portabilityGb ?? 0) > 0 || plan.portabilityLabel) && (
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[hsl(142,70%,40%)]/10 px-3 py-1.5 text-xs font-semibold text-[hsl(142,70%,30%)]">
              {plan.portabilityLabel || `+${plan.portabilityGb}GB na portabilidade`}
            </div>
          )}
          <ul className={cn("space-y-1.5 text-muted-foreground min-w-0", compact ? "text-xs" : "text-sm")}>
            {plan.includes.slice(0, 5).map((it, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <PlanIncludeIcon icon={it.icon} className="mt-0.5 text-accent" />
                <span>{it.text}</span>
              </li>
            ))}
            {(plan.svaIds ?? []).map((svaId) => {
              const sva = allPlans.find((p) => p.id === svaId);
              if (!sva) return null;
              return (
                <li key={svaId} className="flex items-start gap-2">
                  {sva.logoUrl ? (
                    <img src={sva.logoUrl} alt={sva.name} className="mt-0.5 h-4 w-4 shrink-0 rounded-sm object-contain" />
                  ) : (
                    <PlanIncludeIcon icon={sva.icon || "blocks"} className="mt-0.5 text-accent" />
                  )}
                  <span>{sva.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0 min-w-0", compact && "px-4")}>
        <div className="mt-2 flex items-end justify-between gap-2 min-w-0">
          <div>
            {freeOverride ? (
              <>
                <div className="text-sm line-through text-muted-foreground">{formatBRL(plan.priceCents)}</div>
                <div className="text-4xl font-extrabold tracking-tight text-[hsl(142,70%,40%)]">Grátis</div>
                <div className="mt-1 text-xs font-semibold text-[hsl(142,70%,30%)]">incluído no combo</div>
              </>
            ) : (
              <>
                {plan.originalPriceCents && plan.originalPriceCents > 0 && plan.originalPriceCents !== plan.priceCents ? (
                  <div className="text-sm line-through text-muted-foreground">{formatBRL(plan.originalPriceCents)}</div>
                ) : null}
                <div className={cn(compact ? "text-3xl" : "text-4xl", "font-semibold tracking-tight inline")}>
                  {formatBRL(plan.priceCents)}
                  {plan.category === "fibra" && (
                    <sup className="ml-0.5 text-accent font-bold text-xl relative -top-2">*</sup>
                  )}
                </div>
                <span className="ml-1 text-xs text-muted-foreground align-baseline">/mês</span>
              </>
            )}
          </div>
        </div>

        {showBumps ? (
          <div className="mt-5 rounded-xl border bg-muted/20 p-4">
            <div className="text-sm font-semibold">Adicione Internet Móvel (opcional)</div>
            <div className="mt-3 space-y-3">
              {bumpPlans.map((b) => {
                const checked = bumpSelectedId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBumpToggle(b.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 rounded-lg border p-2.5 text-left transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-transparent",
                    )}
                  >
                    <div className={cn(
                      "mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                      checked ? "border-primary bg-primary" : "border-muted-foreground/40",
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="truncate text-sm font-medium">{b.name}</div>
                        <div className="shrink-0 text-sm font-semibold">+ {formatBRL(b.priceCents)}</div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">5G + WhatsApp ilimitado (promo)</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {plan.conditions && (
          <div className="mt-3 space-y-0.5 text-[11px] leading-tight text-muted-foreground/70">
            {plan.conditions.split(/\r?\n/).filter((l) => l.trim().length > 0).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className={cn(compact ? "pb-4 px-4" : "pb-6", "flex-col gap-2")}>
        {willReplaceSameCategory && plan.category === "movel" && (plan as any).type !== "sva" && !isSelected ? (
          <div className="flex w-full flex-col gap-2">
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                const current = items.find(
                  (i) => i.plan.category === "movel" && i.plan.id !== plan.id && (i.plan as any).type !== "sva" && (i.plan as any).type !== "voz",
                );
                if (current) remove(current.plan.id);
                handleAdd();
              }}
            >
              Trocar plano
            </Button>
            <Button className="w-full rounded-xl" onClick={() => handleAdd({ skipSelect: true })}>
              + Adicionar ao pedido
            </Button>
          </div>
        ) : (
          <Button
            className={cn(
              "w-full rounded-xl transition-colors",
              isSelected
                ? "bg-[#25D366] hover:bg-[#20bd5a] text-white"
                : (plan as any).type === "sva"
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                  : "",
            )}
            onClick={() => handleAdd()}
          >
            {isSelected ? "✓ Plano adicionado" : willReplaceSameCategory ? "Trocar plano" : (plan as any).type === "sva" ? "Adicionar" : plan.category === "fibra" ? "Adicionar ao combo" : "Assinar plano"}
          </Button>
        )}

        {isSelected && plan.category === "movel" && (plan as any).type !== "sva" && (() => {
          const cartItem = items.find((i) => i.plan.id === plan.id);
          const qty = cartItem?.qty ?? 1;
          return (
            <div className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">Quantidade de chips</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={(e) => { e.stopPropagation(); setQty(plan.id, Math.max(1, qty - 1)); }}
                  disabled={qty <= 1}
                  aria-label="Diminuir quantidade"
                >
                  −
                </Button>
                <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">{qty}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={(e) => { e.stopPropagation(); setQty(plan.id, qty + 1); }}
                  aria-label="Aumentar quantidade"
                >
                  +
                </Button>
              </div>
            </div>
          );
        })()}
      </CardFooter>

      {!compact && (
        <div
          className={cn(
            "pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full blur-3xl",
            hasAccent ? accent.glow : bestOffer ? "bg-accent/25" : "bg-primary/15",
          )}
          aria-hidden
        />
      )}
      {hasGrade && (
        <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Grade de canais — {plan.name}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-auto">
              <img
                src={plan.logoUrl!}
                alt={`Grade de canais do ${plan.name}`}
                className="h-auto w-full rounded-md"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
});
