import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCart } from "@/cart/CartContext";
import { type Plan, formatBRL } from "@/data/plans";
import { PlanIncludeIcon } from "@/components/shop/PlanIncludeIcon";
import { getPlanAccent } from "@/lib/planAccent";

interface CombosListCardProps {
  plan: Plan;
  allPlans: Plan[];
  isSelected?: boolean;
  onSelect?: (planId: string | null) => void;
  onPlanAdded?: (plan: Plan) => void;
}

export const CombosListCard = React.memo(function CombosListCard({
  plan,
  allPlans,
  isSelected = false,
  onSelect,
  onPlanAdded,
}: CombosListCardProps) {
  const { add, remove, items } = useCart();
  const navigate = useNavigate();
  const accent = getPlanAccent(plan.accentColor);
  const hasAccent = !!accent.value;
  const bestOffer = plan.badges?.includes("Oferta") ?? false;
  const topPick =
    plan.badges?.includes("Mais vendido") ||
    plan.badges?.includes("Melhor custo-benefício");

  const willReplaceSameCategory =
    !isSelected &&
    items.some(
      (i) => i.plan.category === "combo" && i.plan.id !== plan.id,
    );

  const handleAdd = React.useCallback(() => {
    if (isSelected) {
      remove(plan.id);
      onSelect?.(null);
      return;
    }
    const canonical = allPlans.find((p) => p.id === plan.id) ?? plan;
    add(canonical);
    onSelect?.(plan.id);
    if (onPlanAdded) {
      onPlanAdded(plan);
    } else {
      navigate("/personalize-seu-combo", { state: { focusCategory: "fibra" } });
    }
  }, [add, remove, plan, allPlans, isSelected, onSelect, onPlanAdded, navigate]);

  const includes = (plan.includes ?? []).slice(0, 6);
  const svaItems = (plan.svaIds ?? [])
    .map((id) => allPlans.find((p) => p.id === id))
    .filter(Boolean) as Plan[];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        isSelected
          ? "border-[#25D366] ring-2 ring-[#25D366] shadow-lg"
          : hasAccent
            ? cn(accent.border, "shadow-md")
            : bestOffer
              ? "ring-1 ring-accent shadow-md"
              : "shadow-sm",
      )}
    >
      <div className="grid md:grid-cols-[7fr_3fr]">
        {/* ─── 70% — Conteúdo ─── */}
        <div className="relative p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {topPick && <Badge variant="secondary">Destaque</Badge>}
            {plan.badges?.map((b) => (
              <Badge key={b} variant={b === "Oferta" ? "secondary" : "default"}>
                {b}
              </Badge>
            ))}
            {hasAccent && plan.accentLabel && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                  accent.badge,
                )}
              >
                {plan.accentLabel}
              </span>
            )}
          </div>

          <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            {plan.name}
          </h3>
          {plan.description && (
            <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
              {plan.description}
            </p>
          )}

          <ul className="mt-5 grid gap-2.5 text-sm text-foreground/85 sm:grid-cols-2">
            {includes.map((it, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <PlanIncludeIcon icon={it.icon} className="mt-0.5 text-accent" />
                <span>{it.text}</span>
              </li>
            ))}
            {svaItems.map((sva) => (
              <li key={sva.id} className="flex items-start gap-2">
                {sva.logoUrl ? (
                  <img
                    src={sva.logoUrl}
                    alt={sva.name}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-sm object-contain"
                  />
                ) : (
                  <PlanIncludeIcon
                    icon={sva.icon || "blocks"}
                    className="mt-0.5 text-accent"
                  />
                )}
                <span>{sva.name}</span>
              </li>
            ))}
          </ul>

          {plan.conditions && (
            <p className="mt-4 text-[11px] leading-tight text-muted-foreground/70">
              {plan.conditions}
            </p>
          )}

          {/* glow accent decorativo */}
          <div
            className={cn(
              "pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full blur-3xl",
              hasAccent ? accent.glow : bestOffer ? "bg-accent/20" : "bg-primary/10",
            )}
            aria-hidden
          />
        </div>

        {/* ─── 30% — Resumo de valores ─── */}
        <div className="flex flex-col justify-center gap-3 border-t bg-muted/20 p-6 md:border-l md:border-t-0 md:p-8">
          {plan.originalPriceCents &&
            plan.originalPriceCents > 0 &&
            plan.originalPriceCents !== plan.priceCents && (
              <div className="text-sm text-muted-foreground line-through">
                de {formatBRL(plan.originalPriceCents)}
              </div>
            )}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Por apenas
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                {formatBRL(plan.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
          </div>

          {plan.originalPriceCents &&
          plan.originalPriceCents > plan.priceCents ? (
            <div className="inline-flex w-fit items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              Economize{" "}
              {formatBRL(plan.originalPriceCents - plan.priceCents)}/mês
            </div>
          ) : null}

          <Button
            className={cn(
              "mt-2 w-full rounded-xl",
              isSelected
                ? "bg-[#25D366] hover:bg-[#20bd5a] text-white"
                : "",
            )}
            onClick={handleAdd}
          >
            {isSelected
              ? "✓ Combo adicionado"
              : willReplaceSameCategory
                ? "Trocar combo"
                : "Assinar combo"}
          </Button>
        </div>
      </div>
    </article>
  );
});
