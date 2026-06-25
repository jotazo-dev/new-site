import { useState } from "react";
import { Tv, ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/data/plans";
import { useCart } from "@/cart/CartContext";
import { usePlans } from "@/hooks/usePlans";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlanAccent } from "@/lib/planAccent";
import { PlanIncludeIcon } from "@/components/shop/PlanIncludeIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function TVPlansSection() {
  const { add, items, remove } = useCart();
  const { data: plans = [], isLoading } = usePlans();
  const tvPlans = plans.filter((p) => p.category === "tv");
  const [gradePlan, setGradePlan] = useState<{ name: string; url: string } | null>(null);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="mx-auto h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </section>
    );
  }

  if (tvPlans.length === 0) return null;

  return (
    <section className="space-y-6">
      <header className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Tv className="h-5 w-5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Planos de TV
          </span>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">
          Assine e assista agora
        </h2>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Escolha o plano ideal para curtir TV por assinatura com 80+ canais, esportes ao vivo e muito mais.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tvPlans.map((plan) => {
          const inCart = items.some((i) => i.plan.id === plan.id);
          const accent = getPlanAccent(plan.accentColor);
          const hasAccent = !!accent.value;
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1",
                inCart
                  ? "border-[#25D366] ring-2 ring-[#25D366] shadow-lg"
                  : hasAccent
                    ? cn(accent.border, "shadow-lg")
                    : "shadow-sm hover:shadow-lg"
              )}
            >
              {plan.logoUrl && (
                <button
                  type="button"
                  onClick={() => setGradePlan({ name: plan.name, url: plan.logoUrl! })}
                  aria-label={`Ver grade de canais do ${plan.name}`}
                  className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ListVideo className="h-3.5 w-3.5" />
                  Grade
                </button>
              )}
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-3 flex h-14 items-center justify-start">
                  <Tv className="h-10 w-10 text-accent" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

                <div className="mt-4 space-y-2">
                  {plan.badges && plan.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {plan.badges.map((b) => (
                        <span
                          key={b}
                          className={cn(
                            "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase",
                            hasAccent ? accent.badge : "bg-accent text-accent-foreground",
                          )}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  {plan.originalPriceCents && plan.originalPriceCents > plan.priceCents && (
                    <div className="text-sm line-through text-muted-foreground">
                      De {formatBRL(plan.originalPriceCents)}
                    </div>
                  )}
                  <div>
                    <span className="text-3xl font-bold tracking-tight">
                      {formatBRL(plan.priceCents)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {plan.includes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <PlanIncludeIcon icon={item.icon} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {item.text}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <Button
                    className={cn(
                      "w-full rounded-xl transition-colors",
                      inCart && "bg-[#25D366] hover:bg-[#20bd5a] text-white",
                    )}
                    onClick={() => (inCart ? remove(plan.id) : add(plan))}
                  >
                    {inCart ? "✓ Plano adicionado" : "Assinar agora"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!gradePlan} onOpenChange={(open) => !open && setGradePlan(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Grade de canais — {gradePlan?.name}</DialogTitle>
          </DialogHeader>
          {gradePlan && (
            <div className="max-h-[75vh] overflow-auto">
              <img
                src={gradePlan.url}
                alt={`Grade de canais do ${gradePlan.name}`}
                className="h-auto w-full rounded-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
