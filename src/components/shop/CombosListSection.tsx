import * as React from "react";
import { useCart } from "@/cart/CartContext";
import { usePlans } from "@/hooks/usePlans";
import { type Plan } from "@/data/plans";

import { Skeleton } from "@/components/ui/skeleton";
import { CombosListCard } from "@/components/shop/CombosListCard";
import { PlanSelectedDialog } from "@/components/shop/PlanSelectedDialog";

export function CombosListSection() {
  const { items, remove } = useCart();
  const { data: plans = [], isLoading } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [dialogPlan, setDialogPlan] = React.useState<Plan | null>(null);

  const combos = React.useMemo(
    () =>
      plans.filter(
        (p) =>
          p.category === "combo" &&
          (p as any).type !== "upsell" &&
          (p as any).type !== "sva",
      ),
    [plans],
  );

  // Sincroniza seleção com o carrinho (mantém highlight após reload)
  React.useEffect(() => {
    if (selectedPlanId && !items.some((i) => i.plan.id === selectedPlanId)) {
      setSelectedPlanId(null);
      return;
    }
    if (!selectedPlanId) {
      const found = items.find((i) => i.plan.category === "combo");
      if (found) setSelectedPlanId(found.plan.id);
    }
  }, [items, selectedPlanId]);

  const handleSelectPlan = React.useCallback(
    (planId: string | null) => {
      if (selectedPlanId && selectedPlanId !== planId) {
        remove(selectedPlanId);
      }
      setSelectedPlanId(planId);
    },
    [selectedPlanId, remove],
  );

  if (isLoading) {
    return (
      <section className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (combos.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight">Combos</h2>
        <p className="text-sm text-muted-foreground">
          Nenhum combo disponível no momento.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Mais economia
        </span>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Combos com mais vantagens
        </h2>
        <p className="text-sm text-muted-foreground">
          Internet, TV e 5G no mesmo pacote — pague menos do que contratar separado.
        </p>
      </header>

      <div className="space-y-4">
        {combos.map((p) => (
          <CombosListCard
            key={p.id}
            plan={p}
            allPlans={plans}
            isSelected={selectedPlanId === p.id}
            onSelect={handleSelectPlan}
            onPlanAdded={setDialogPlan}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Promoções e condições podem variar por cidade e viabilidade técnica.
      </p>

      <PlanSelectedDialog
        plan={dialogPlan}
        open={!!dialogPlan}
        onOpenChange={(open) => {
          if (!open) setDialogPlan(null);
        }}
      />
    </section>
  );
}
