import * as React from "react";
import { ArrowUp, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, type Plan } from "@/data/plans";

interface FiberTvUpgradeBannerProps {
  /** Plano de fibra atualmente selecionado */
  selectedFiber: Plan;
  /** Todos os planos de fibra disponíveis */
  fiberPlans: Plan[];
  /** Velocidade mínima (em MB) que dá TV grátis */
  freeTvSpeedMb?: number;
  /** Callback ao clicar no botão de upgrade */
  onUpgrade: (plan: Plan) => void;
}

function speedFromName(name: string) {
  return parseInt(name.replace(/\D/g, ""), 10) || 0;
}

export function FiberTvUpgradeBanner({
  selectedFiber,
  fiberPlans,
  freeTvSpeedMb = 500,
  onUpgrade,
}: FiberTvUpgradeBannerProps) {
  const currentSpeed = speedFromName(selectedFiber.name);
  const upgradePlan = React.useMemo(() => {
    const candidates = fiberPlans
      .filter((p) => speedFromName(p.name) >= freeTvSpeedMb && p.priceCents > selectedFiber.priceCents)
      .sort((a, b) => a.priceCents - b.priceCents);
    return candidates[0] || null;
  }, [fiberPlans, selectedFiber, freeTvSpeedMb]);

  // Só exibe se: plano atual abaixo do limiar E há um upgrade disponível
  if (currentSpeed >= freeTvSpeedMb || !upgradePlan) return null;

  const diffCents = upgradePlan.priceCents - selectedFiber.priceCents;

  return (
    <div className="animate-fade-in rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
          <Tv className="h-6 w-6 text-accent" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">
            💡 Seu plano <strong>{selectedFiber.name}</strong> não inclui TV por assinatura
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Por apenas <strong className="text-accent">+{formatBRL(diffCents)}/mês</strong> faça
            upgrade para o <strong>{upgradePlan.name}</strong> e leve <strong>TV grátis</strong> inclusa.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onUpgrade(upgradePlan)}
          className="shrink-0 bg-accent text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90"
        >
          <ArrowUp className="mr-1 h-4 w-4" /> Fazer upgrade
        </Button>
      </div>
    </div>
  );
}
