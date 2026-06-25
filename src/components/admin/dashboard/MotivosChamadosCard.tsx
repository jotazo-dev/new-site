import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Calendar, AlertCircle } from "lucide-react";
import { useRbxAtendimentos } from "@/hooks/useRbxAtendimentos";

function todayISO() {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  return f.format(new Date());
}

function formatTodayLabel() {
  const f = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  return f.format(new Date());
}

export function MotivosChamadosCard() {
  const today = todayISO();
  const { data, isLoading, error } = useRbxAtendimentos(today, today, { enrich: false });

  const counts = new Map<string, number>();
  (data || []).forEach((a) => {
    const key = (a.reason || a.type || "Sem motivo").trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const motivos = Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const total = motivos.reduce((s, m) => s + m.count, 0);
  const max = motivos[0]?.count || 1;

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg">
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 opacity-20 blur-2xl" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg">
              <ListChecks className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Motivos dos Chamados
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 capitalize">
                <Calendar className="h-3 w-3" />
                {formatTodayLabel()}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm font-bold">
            {isLoading ? "…" : total}
          </Badge>
        </div>

        <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {isLoading && (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}

          {!isLoading && error && (
            <div className="flex items-center gap-2 text-sm text-amber-600 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4" />
              Falha ao carregar motivos
            </div>
          )}

          {!isLoading && !error && motivos.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhum chamado hoje.
            </div>
          )}

          {!isLoading && !error && motivos.map((m) => {
            const pct = Math.round((m.count / max) * 100);
            return (
              <div key={m.reason} className="p-2.5 rounded-lg border bg-card">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium truncate">{m.reason}</span>
                  <span className="text-xs font-bold tabular-nums shrink-0">{m.count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
