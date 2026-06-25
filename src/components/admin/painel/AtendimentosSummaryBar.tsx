import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Atendimento, AtendimentoStatus } from "@/hooks/useRbxAtendimentos";
import { STATUS_META, STATUS_ORDER } from "./atendimentoStatus";

export function AtendimentosSummaryBar({
  atendimentos, monthLabel, activeFilter, onFilterChange,
}: {
  atendimentos: Atendimento[];
  monthLabel: string;
  activeFilter: AtendimentoStatus | "all";
  onFilterChange: (s: AtendimentoStatus | "all") => void;
}) {
  const counts = STATUS_ORDER.reduce<Record<AtendimentoStatus, number>>((acc, s) => {
    acc[s] = atendimentos.filter((a) => a.status === s).length;
    return acc;
  }, { aberto: 0, em_andamento: 0, concluido: 0, cancelado: 0 });

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-wrap items-center gap-3">
      <div className="text-sm">
        <span className="font-semibold">{atendimentos.length}</span>{" "}
        <span className="text-muted-foreground">atendimentos em {monthLabel}</span>
      </div>
      <div className="h-5 w-px bg-border hidden sm:block" />
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant={activeFilter === "all" ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => onFilterChange("all")}
        >
          Todos
        </Button>
        {STATUS_ORDER.map((s) => {
          const meta = STATUS_META[s];
          const active = activeFilter === s;
          return (
            <Button
              key={s}
              size="sm"
              variant="outline"
              className={cn("h-7 text-xs gap-1.5", active && "ring-2 ring-offset-1", active && meta.ring)}
              onClick={() => onFilterChange(s)}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              {meta.label}
              <span className="text-muted-foreground">{counts[s]}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
