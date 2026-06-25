import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Headset, Calendar, User, Clock, AlertCircle } from "lucide-react";
import { useRbxAtendimentos } from "@/hooks/useRbxAtendimentos";
import { STATUS_META } from "@/components/admin/painel/atendimentoStatus";

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

function formatTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function ChamadosAbertosHojeCard() {
  const today = todayISO();
  const { data, isLoading, error } = useRbxAtendimentos(today, today, { enrich: true });

  const abertos = (data || [])
    .filter((a) => a.status === "aberto")
    .slice()
    .sort((a, b) => {
      const ta = a.openedAt ? new Date(a.openedAt).getTime() : 0;
      const tb = b.openedAt ? new Date(b.openedAt).getTime() : 0;
      return tb - ta;
    });

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg">
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 opacity-20 blur-2xl" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <Headset className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Chamados Abertos Hoje
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 capitalize">
                <Calendar className="h-3 w-3" />
                {formatTodayLabel()}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm font-bold">
            {isLoading ? "…" : abertos.length}
          </Badge>
        </div>

        <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {isLoading && (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          )}

          {!isLoading && error && (
            <div className="flex items-center gap-2 text-sm text-amber-600 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4" />
              Falha ao carregar chamados
            </div>
          )}

          {!isLoading && !error && abertos.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhum chamado aberto hoje.
            </div>
          )}

          {!isLoading && !error && abertos.map((a) => {
            const meta = STATUS_META[a.status];
            return (
              <div
                key={a.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">#{a.protocol}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${meta.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium truncate">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{a.customerName}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{a.type}{a.reason ? ` · ${a.reason}` : ""}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(a.openedAt)}
                  </span>
                  {a.technician && <span className="truncate">Téc: {a.technician}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
