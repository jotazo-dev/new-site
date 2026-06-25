import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Smartphone, TrendingDown, AlertCircle, CalendarPlus, Headset } from "lucide-react";
import { useAdminClientesKpis } from "@/hooks/useAdminClientesKpis";

const nf = new Intl.NumberFormat("pt-BR");

type CardSpec = {
  label: string;
  value?: number;
  subtitle: string;
  icon: any;
  color: string;
  warn?: string;
};

function KpiCard({ label, value, subtitle, icon: Icon, color, warn, loading }: CardSpec & { loading: boolean }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            {label}
            {warn && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>{warn}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {loading ? <Skeleton className="h-8 w-20" /> : nf.format(value ?? 0)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground truncate">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function ClientesKpiCards() {
  const { data, isLoading } = useAdminClientesKpis();

  const errSummary = (...keys: ("rbx" | "algar" | "eai")[]) => {
    const errs = data?.errors || {};
    const failed = keys.filter((k) => errs[k]);
    return failed.length ? `Falha ao carregar: ${failed.map((k) => k.toUpperCase()).join(", ")}` : undefined;
  };

  const cards: (CardSpec)[] = [
    {
      label: "Clientes (total)",
      value: data?.total.value,
      subtitle: data
        ? `RBX ${nf.format(data.total.bySource.rbx)} · Algar ${nf.format(data.total.bySource.algar)} · EAI ${nf.format(data.total.bySource.eai)}`
        : "RBX + Algar + EAI",
      icon: Users,
      color: "from-blue-500 to-blue-700",
      warn: errSummary("rbx", "algar", "eai"),
    },
    {
      label: "Clientes MVNO ativos",
      value: data?.mvnoAtivos.value,
      subtitle: data
        ? `Algar ${nf.format(data.mvnoAtivos.bySource.algar)} · EAI ${nf.format(data.mvnoAtivos.bySource.eai)}`
        : "Algar + EAI",
      icon: Smartphone,
      color: "from-emerald-500 to-emerald-700",
      warn: errSummary("algar", "eai"),
    },
    {
      label: "Linhas MVNO no mês",
      value: data?.mvnoMes.value,
      subtitle: data
        ? `Algar ${nf.format(data.mvnoMes.bySource.algar)} · EAI ${nf.format(data.mvnoMes.bySource.eai)}`
        : "Algar + EAI · mês atual",
      icon: CalendarPlus,
      color: "from-violet-500 to-violet-700",
      warn: errSummary("algar", "eai"),
    },
    {
      label: "Chamados no mês",
      value: data?.chamadosMes.value,
      subtitle: "Atendimentos abertos · RBX",
      icon: Headset,
      color: "from-rose-500 to-rose-700",
      warn: data?.errors.chamados ? `Falha ao carregar: RBX` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} loading={isLoading} />
      ))}
    </div>
  );
}
