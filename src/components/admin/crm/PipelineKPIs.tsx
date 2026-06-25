import { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Clock, BarChart3 } from "lucide-react";
import { formatBRL } from "@/data/plans";
import { cn } from "@/lib/utils";
import { groupLeadsByContact, type CrmLead } from "./types";

interface PipelineKPIsProps {
  leads: CrmLead[];
}

function pct(curr: number, prev: number): { value: number; up: boolean | null } {
  if (prev === 0) return { value: 0, up: null };
  const v = ((curr - prev) / prev) * 100;
  return { value: Math.abs(v), up: v >= 0 };
}

function inMonth(iso: string, monthsAgo: number): boolean {
  const d = new Date(iso);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const next = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return d >= target && d < next;
}

export function PipelineKPIs({ leads }: PipelineKPIsProps) {
  const kpis = useMemo(() => {
    // Pipeline ativo: 1 pedido por contato (o mais recente que ainda esteja ativo).
    const contacts = groupLeadsByContact(leads);
    const activePrimary: CrmLead[] = [];
    for (const c of contacts) {
      const mostRecentActive = c.leads.find(
        (l) => l.stage !== "instalado" && l.stage !== "perdido",
      );
      if (mostRecentActive) activePrimary.push(mostRecentActive);
    }

    const wonNow = leads.filter((l) => l.stage === "instalado" && inMonth(l.updated_at, 0));
    const wonPrev = leads.filter((l) => l.stage === "instalado" && inMonth(l.updated_at, 1));
    const lostNow = leads.filter((l) => l.stage === "perdido" && inMonth(l.updated_at, 0));

    const pipelineTotal = activePrimary.reduce((s, l) => s + l.total_cents, 0);
    const wonRevenue = wonNow.reduce((s, l) => s + l.total_cents, 0);
    const wonRevenuePrev = wonPrev.reduce((s, l) => s + l.total_cents, 0);

    const totalClosed = wonNow.length + lostNow.length;
    const conversion = totalClosed > 0 ? (wonNow.length / totalClosed) * 100 : 0;

    const avgTicket = leads.length > 0 ? leads.reduce((s, l) => s + l.total_cents, 0) / leads.length : 0;

    const closingTimes = leads
      .filter((l) => l.stage === "instalado")
      .map((l) => (new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()) / 86400000)
      .filter((d) => d >= 0);
    const avgClosing = closingTimes.length > 0 ? closingTimes.reduce((a, b) => a + b, 0) / closingTimes.length : 0;

    return {
      pipelineTotal,
      pipelineCount: activePrimary.length,
      wonRevenue,
      wonDelta: pct(wonRevenue, wonRevenuePrev),
      wonCount: wonNow.length,
      conversion,
      conversionLost: lostNow.length,
      avgTicket,
      avgClosing,
    };
  }, [leads]);

  const cards: Array<{
    label: string;
    value: string;
    sub?: string;
    icon: typeof DollarSign;
    accent: string;
    delta?: { value: number; up: boolean | null };
  }> = [
    {
      label: "Pipeline ativo",
      value: formatBRL(kpis.pipelineTotal),
      sub: `${kpis.pipelineCount} leads em aberto`,
      icon: BarChart3,
      accent: "text-primary",
    },
    {
      label: "Receita ganha (mês)",
      value: formatBRL(kpis.wonRevenue),
      sub: `${kpis.wonCount} instalados`,
      icon: DollarSign,
      accent: "text-success",
      delta: kpis.wonDelta,
    },
    {
      label: "Conversão",
      value: `${kpis.conversion.toFixed(1)}%`,
      sub: `${kpis.wonCount} ganhos · ${kpis.conversionLost} perdidos`,
      icon: Target,
      accent: "text-accent-foreground",
    },
    {
      label: "Ticket médio",
      value: formatBRL(kpis.avgTicket),
      sub: "por pedido",
      icon: Award,
      accent: "text-primary",
    },
    {
      label: "Tempo médio de fechamento",
      value: kpis.avgClosing > 0 ? `${kpis.avgClosing.toFixed(1)} dias` : "—",
      sub: "criação → instalação",
      icon: Clock,
      accent: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {c.label}
              </span>
              <Icon className={cn("h-4 w-4", c.accent)} />
            </div>
            <div className="text-2xl font-bold text-foreground">{c.value}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {c.sub && <span>{c.sub}</span>}
              {c.delta && c.delta.up !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    c.delta.up
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {c.delta.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {c.delta.value.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
