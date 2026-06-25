import { useEffect, useMemo, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, LayoutGrid, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useRbxAtendimentos, type Atendimento, type AtendimentoStatus } from "@/hooks/useRbxAtendimentos";
import { AtendimentoDetailsDialog } from "@/components/admin/painel/AtendimentoDetailsDialog";
import { AtendimentosSummaryBar } from "@/components/admin/painel/AtendimentosSummaryBar";
import { CalendarMonthView } from "@/components/admin/painel/CalendarMonthView";
import { CalendarFortnightView } from "@/components/admin/painel/CalendarFortnightView";
import { CalendarWeekView } from "@/components/admin/painel/CalendarWeekView";
import { CalendarDayView } from "@/components/admin/painel/CalendarDayView";
import {
  addDays, endOfWeekSunday, formatRange, MONTH_NAMES,
  startOfDay, startOfWeekMonday, toISODate,
} from "@/components/admin/painel/dateUtils";

function getTodayFormatted(): string {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

type ViewMode = "day" | "week" | "fortnight" | "month";
const VIEW_KEY = "painel.calendarView";

function CalendarView() {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "month";
    return (localStorage.getItem(VIEW_KEY) as ViewMode) || "month";
  });
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [filter, setFilter] = useState<AtendimentoStatus | "all">("all");
  const [selected, setSelected] = useState<Atendimento | null>(null);

  useEffect(() => { localStorage.setItem(VIEW_KEY, mode); }, [mode]);

  const { from, to, title, summaryLabel } = useMemo(() => {
    if (mode === "day") {
      const next = addDays(anchor, 1);
      return {
        from: toISODate(anchor),
        to: toISODate(next),
        title: formatRange(anchor, next),
        summaryLabel: formatRange(anchor, next),
      };
    }
    if (mode === "week") {
      const s = startOfWeekMonday(anchor);
      const e = endOfWeekSunday(anchor);
      return { from: toISODate(s), to: toISODate(e), title: `Semana ${formatRange(s, e)}`, summaryLabel: formatRange(s, e) };
    }
    if (mode === "fortnight") {
      const e = addDays(anchor, 14);
      return { from: toISODate(anchor), to: toISODate(e), title: formatRange(anchor, e), summaryLabel: formatRange(anchor, e) };
    }
    const y = anchor.getFullYear(), m = anchor.getMonth();
    const s = new Date(y, m, 1);
    const e = new Date(y, m + 1, 0);
    return { from: toISODate(s), to: toISODate(e), title: `${MONTH_NAMES[m]} ${y}`, summaryLabel: `${MONTH_NAMES[m]}/${y}` };
  }, [mode, anchor]);

  const { data: atendimentos = [], isLoading, error, refetch, isFetching } = useRbxAtendimentos(from, to);

  const filtered = useMemo(
    () => (filter === "all" ? atendimentos : atendimentos.filter((a) => a.status === filter)),
    [atendimentos, filter],
  );

  const goPrev = () => {
    if (mode === "day") setAnchor((d) => addDays(d, -1));
    else if (mode === "week") setAnchor((d) => addDays(d, -7));
    else if (mode === "fortnight") setAnchor((d) => addDays(d, -15));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const goNext = () => {
    if (mode === "day") setAnchor((d) => addDays(d, 1));
    else if (mode === "week") setAnchor((d) => addDays(d, 7));
    else if (mode === "fortnight") setAnchor((d) => addDays(d, 15));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const goToday = () => setAnchor(startOfDay(new Date()));

  return (
    <div className="space-y-4">
      <AtendimentosSummaryBar
        atendimentos={atendimentos}
        monthLabel={summaryLabel}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="text-base font-semibold min-w-[220px] text-center capitalize">{title}</h3>
            <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">Hoje</Button>
          </div>

          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => v && setMode(v as ViewMode)}
            variant="outline"
            size="sm"
            className="gap-0"
          >
            <ToggleGroupItem value="day" className="text-xs px-3">Dia</ToggleGroupItem>
            <ToggleGroupItem value="week" className="text-xs px-3">Semana</ToggleGroupItem>
            <ToggleGroupItem value="fortnight" className="text-xs px-3">15 dias</ToggleGroupItem>
            <ToggleGroupItem value="month" className="text-xs px-3">Mês</ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="outline" size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            {isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Atualizar
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Não foi possível carregar atendimentos da RBX</p>
              <p className="text-xs text-muted-foreground mt-0.5">{(error as Error).message}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando atendimentos…
          </div>
        )}

        {!isLoading && (
          <>
            {mode === "month" && <CalendarMonthView anchor={anchor} atendimentos={filtered} onSelect={setSelected} />}
            {mode === "fortnight" && <CalendarFortnightView anchor={anchor} atendimentos={filtered} onSelect={setSelected} />}
            {mode === "week" && <CalendarWeekView anchor={anchor} atendimentos={filtered} onSelect={setSelected} />}
            {mode === "day" && <CalendarDayView anchor={anchor} atendimentos={filtered} onSelect={setSelected} />}
          </>
        )}

        {!isLoading && !error && atendimentos.length === 0 && mode !== "day" && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Nenhum atendimento encontrado neste período.
          </p>
        )}
      </Card>

      <AtendimentoDetailsDialog
        atendimento={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}

/* ── Kanban (placeholder unchanged) ── */
const KANBAN_COLS = [
  { id: "backlog", label: "Backlog", color: "bg-muted-foreground/20" },
  { id: "todo", label: "A fazer", color: "bg-blue-500/20" },
  { id: "doing", label: "Em andamento", color: "bg-amber-500/20" },
  { id: "done", label: "Concluído", color: "bg-green-500/20" },
];

function KanbanView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {KANBAN_COLS.map((col) => (
        <Card key={col.id} className="flex flex-col">
          <div className="flex items-center gap-2 p-4 border-b">
            <span className={cn("h-3 w-3 rounded-full", col.color)} />
            <h4 className="text-sm font-semibold">{col.label}</h4>
            <span className="ml-auto text-xs text-muted-foreground">0</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 min-h-[200px]">
            <p className="text-sm text-muted-foreground text-center">
              Conecte uma API para ver tarefas aqui
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPainel() {
  const todayFormatted = getTodayFormatted();

  return (
    <div className="space-y-6">
      <AdminPageHeader title={`Atendimentos: ${todayFormatted}`} subtitle="Calendário e quadro de tarefas" />

      <Tabs defaultValue="calendario" className="w-full">
        <TabsList>
          <TabsTrigger value="calendario" className="gap-2">
            <CalendarRange className="h-4 w-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" /> Kanban
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario">
          <CalendarView />
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
