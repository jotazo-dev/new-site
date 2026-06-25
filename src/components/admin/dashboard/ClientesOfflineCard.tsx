import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { WifiOff, AlertCircle, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { useClientesOffline, type OfflineBucket } from "@/hooks/useClientesOffline";
import { cn } from "@/lib/utils";

function formatTime(iso?: string) {
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

function RankingList({ title, items }: { title: string; items: OfflineBucket[] }) {
  const max = items[0]?.count || 1;
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">Sem dados</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((b) => {
            const pct = Math.round((b.count / max) * 100);
            return (
              <div key={b.key} className="p-2 rounded-md border bg-card">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium truncate">{b.key}</span>
                  <span className="text-xs font-bold tabular-nums shrink-0">{b.count}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ClientesOfflineCard() {
  const { data, isLoading, error } = useClientesOffline();

  const alert = !!data?.alert;
  const total = data?.total ?? 0;
  const delta = data?.delta_pct;
  const hasDelta = typeof delta === "number" && !Number.isNaN(delta);
  const trendIcon = !hasDelta ? Minus : (delta as number) > 0 ? TrendingUp : (delta as number) < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = !hasDelta
    ? "text-muted-foreground"
    : (delta as number) > 5
    ? "text-red-600"
    : (delta as number) > 0
    ? "text-amber-600"
    : "text-emerald-600";

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 shadow-lg",
        alert && "ring-2 ring-red-500/50",
      )}
    >
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-red-500 to-orange-700 opacity-20 blur-2xl" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-700 flex items-center justify-center shadow-lg">
              <WifiOff className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Clientes Offline
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Atualizado {formatTime(data?.fetched_at)}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm font-bold">
            {isLoading ? "…" : total.toLocaleString("pt-BR")}
          </Badge>
        </div>

        {isLoading && (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="h-4 w-4" />
            Falha ao carregar clientes offline
          </div>
        )}

        {!isLoading && !error && data?.ok === false && (
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="h-4 w-4" />
            {data?.message || "Indisponível"}
          </div>
        )}

        {!isLoading && !error && data?.ok && (
          <div className="mt-4 space-y-4">
            {/* Total + delta */}
            <div className="flex items-end justify-between gap-3 p-3 rounded-lg border bg-card">
              <div>
                <div className="text-3xl font-bold tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {total.toLocaleString("pt-BR")}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">total offline agora</p>
              </div>
              <div className={cn("flex items-center gap-1 text-sm font-semibold", trendColor)}>
                <TrendIcon className="h-4 w-4" />
                {hasDelta ? `${(delta as number) > 0 ? "+" : ""}${(delta as number).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"}
                <span className="text-[11px] font-normal text-muted-foreground ml-1">1h</span>
              </div>
            </div>

            {alert && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-700 p-2.5 rounded-lg bg-red-50 border border-red-200 animate-pulse">
                <AlertCircle className="h-4 w-4" />
                Alerta: crescimento de {(delta as number).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% na última hora
              </div>
            )}

            <RankingList title="Clientes" items={data.by_client || []} />
            <RankingList title="Por região" items={data.by_region || []} />
            {!!data.by_nas?.length && <RankingList title="Por concentrador" items={data.by_nas} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
