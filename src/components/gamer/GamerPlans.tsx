import { useMemo } from "react";
import { usePlans } from "@/hooks/usePlans";
import { PremiumPlanCard } from "@/components/shop/PremiumPlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function extractMbps(plan: { name: string; description?: string }): number {
  const text = `${plan.name} ${plan.description ?? ""}`;
  const gbps = text.match(/(\d+(?:[\.,]\d+)?)\s*g(?:bps|b)\b/i);
  if (gbps) return parseFloat(gbps[1].replace(",", ".")) * 1000;
  const mb = text.match(/(\d{2,5})\s*m(?:bps|b)?\b/i);
  if (mb) return parseInt(mb[1], 10);
  return 0;
}

export function GamerPlans() {
  const { data: plans = [], isLoading } = usePlans();

  const display = useMemo(() => {
    const fibra = plans.filter((p) => p.category === "fibra" && (p as any).type !== "sva");
    const ranked = fibra
      .map((p) => ({ p, mbps: extractMbps(p) }))
      .sort((a, b) => b.mbps - a.mbps);
    const giga = ranked.filter(({ mbps }) => mbps >= 1000);
    const chosen = (giga.length > 0 ? giga : ranked).slice(0, 3).map(({ p }) => p);
    return chosen;
  }, [plans]);

  return (
    <section id="gamer-plans" className="space-y-10 scroll-mt-24">
      <div className="space-y-2 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Planos 1Giga+
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Pensados pra alta performance
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Velocidade alta, upload simétrico e Wi-Fi 6 incluso. Escolha o seu e
          bora pro próximo rank.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[480px] w-full rounded-2xl" />
          ))}
        </div>
      ) : display.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          Nenhum plano disponível no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {display.map((plan, idx) => {
            const isFeatured = idx === 1 && display.length === 3;
            return (
              <div
                key={plan.id}
                className={
                  isFeatured
                    ? "relative rounded-[20px] p-[2px] bg-gradient-to-br from-accent via-primary to-accent shadow-[0_0_60px_-12px_hsl(var(--accent)/0.5)]"
                    : "relative"
                }
              >
                <div className={isFeatured ? "rounded-[18px] overflow-hidden h-full" : ""}>
                  <PremiumPlanCard plan={plan} allPlans={plans} redirectOnSelect />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <Button asChild variant="outline" size="lg" className="rounded-xl">
          <Link to="/planos">Ver todos os planos</Link>
        </Button>
      </div>
    </section>
  );
}
