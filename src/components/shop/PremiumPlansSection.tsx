import * as React from "react";
import { useCart } from "@/cart/CartContext";
import { usePlans } from "@/hooks/usePlans";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { type Plan } from "@/data/plans";
import { useSelectedCity } from "@/hooks/useSelectedCity";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { pickPlansForTab, type TabKey } from "@/components/shop/planDistribution";
import { PremiumPlanCard } from "@/components/shop/PremiumPlanCard";
import { PlanSelectedDialog } from "@/components/shop/PlanSelectedDialog";
import { Skeleton } from "@/components/ui/skeleton";

const tabs: { key: TabKey; label: string; description: string }[] = [
  { key: "internet_fibra", label: "Internet Fibra", description: "Fibra óptica pra casa toda." },
  { key: "streaming_tv", label: "Streaming TV", description: "Planos de TV por assinatura." },
];

interface PremiumPlansSectionProps {
  categoryFilter?: string;
}

export function PremiumPlansSection({ categoryFilter }: PremiumPlansSectionProps = {}) {
  const [active, setActive] = React.useState<TabKey>("internet_fibra");
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [dialogPlan, setDialogPlan] = React.useState<Plan | null>(null);
  const { items, remove } = useCart();
  const { data: plans = [], isLoading } = usePlans();
  const settings = useSiteSettings();
  const { city } = useSelectedCity();

  const columns = settings["premium_plans_columns"] === "4" ? 4 : 3;
  const planLimit = columns === 4 ? 8 : 6;
  const mobileColumns = settings["premium_plans_mobile_columns"] === "2" ? 2 : 1;
  const mobileMode = settings["premium_plans_mobile_mode"] === "grade" ? "grade" : "slide";

  // Sincroniza a seleção com o carrinho persistido (mantém highlight após reload)
  React.useEffect(() => {
    if (selectedPlanId && !items.some((i) => i.plan.id === selectedPlanId)) {
      setSelectedPlanId(null);
      return;
    }
    if (!selectedPlanId && items.length > 0) {
      // Prioriza fibra > móvel > tv > primeiro item
      const priority = ["fibra", "movel", "tv"];
      const found =
        priority
          .map((cat) => items.find((i) => i.plan.category === cat))
          .find(Boolean) ?? items[0];
      if (found) setSelectedPlanId(found.plan.id);
    }
  }, [items, selectedPlanId]);

  const handleSelectPlan = React.useCallback((planId: string | null) => {
    if (selectedPlanId && selectedPlanId !== planId) {
      remove(selectedPlanId);
    }
    setSelectedPlanId(planId);
  }, [selectedPlanId, remove]);

  const handlePlanAdded = React.useCallback((p: Plan) => {
    if (p.category === "fibra") {
      window.dispatchEvent(new CustomEvent("cart:open"));
      return;
    }
    setDialogPlan(p);
  }, []);

  // When categoryFilter is set, bypass tabs entirely
  const filteredByCategory = React.useMemo(
    () => categoryFilter ? plans.filter((p) => p.category === categoryFilter && (p as any).type !== "upsell").slice(0, planLimit) : null,
    [categoryFilter, plans, planLimit]
  );

  const visibleTabs = React.useMemo(
    () => tabs.filter((t) => pickPlansForTab(t.key, plans, planLimit).length > 0),
    [plans, planLimit]
  );

  const safeActive = React.useMemo(() => {
    if (visibleTabs.some((t) => t.key === active)) return active;
    return visibleTabs[0]?.key ?? "internet_fibra";
  }, [active, visibleTabs]);

  const visible = React.useMemo(
    () => filteredByCategory ?? pickPlansForTab(safeActive, plans, planLimit),
    [filteredByCategory, safeActive, plans, planLimit]
  );

  if (isLoading) {
    return (
      <section className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">
          {city ? (<>Planos disponíveis em <span className="text-accent">{city.name}</span></>) : "Escolha o seu plano"}
        </h2>
        <p className="text-sm text-muted-foreground">Selecione o plano que mais se adequa a você.</p>
      </header>

      {!categoryFilter && (
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((t) => {
            const selected = t.key === safeActive;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={cn(
                  "rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground hover:bg-muted",
                )}
                aria-pressed={selected}
                title={t.description}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {(mobileMode === "slide" || visible.length > columns) ? (
        <div className="relative">
          <Carousel opts={{ align: "start", loop: false }}>
            <CarouselContent>
              {visible.map((p) => (
                <CarouselItem
                  key={p.id}
                  className={cn(
                    mobileColumns === 2 ? "basis-1/2" : "basis-[86%]",
                    "sm:basis-1/2",
                    columns === 4 ? "lg:basis-1/4" : "lg:basis-1/3"
                  )}
                >
                  <div className="h-full p-2">
                    <PremiumPlanCard plan={p} allPlans={plans} isSelected={selectedPlanId === p.id} onSelect={handleSelectPlan} {...(p.category === "fibra" ? { onPlanAdded: handlePlanAdded } : { redirectOnSelect: true, onPlanAdded: handlePlanAdded })} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious variant="outline" className="-left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
            <CarouselNext variant="outline" className="-right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
          </Carousel>
        </div>
      ) : (
        <div className={cn(
          "grid gap-4 p-2 md:grid-cols-2",
          mobileColumns === 2 ? "grid-cols-2" : "grid-cols-1",
          columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}>
          {visible.map((p) => (
            <PremiumPlanCard key={p.id} plan={p} allPlans={plans} isSelected={selectedPlanId === p.id} onSelect={handleSelectPlan} {...(p.category === "fibra" ? { onPlanAdded: handlePlanAdded } : { redirectOnSelect: true, onPlanAdded: handlePlanAdded })} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Promoções e condições podem variar por cidade e viabilidade técnica.</p>

      <PlanSelectedDialog
        plan={dialogPlan}
        open={!!dialogPlan}
        onOpenChange={(open) => { if (!open) setDialogPlan(null); }}
      />
    </section>
  );
}
