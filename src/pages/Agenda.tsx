import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AgendaNavbar } from "@/components/agenda/AgendaNavbar";
import { AgendaPasswordGate } from "@/components/agenda/AgendaPasswordGate";
import { useRbxAgendaPublic } from "@/hooks/useRbxAgendaPublic";
import type { Atendimento, AtendimentoStatus } from "@/hooks/useRbxAtendimentos";
import { STATUS_META, STATUS_ORDER } from "@/components/admin/painel/atendimentoStatus";
import { AgendaAtendimentoDialog } from "@/components/agenda/AgendaAtendimentoDialog";
import { CalendarMonthView } from "@/components/admin/painel/CalendarMonthView";
import { CalendarFortnightView } from "@/components/admin/painel/CalendarFortnightView";
import { CalendarWeekView } from "@/components/admin/painel/CalendarWeekView";
import { CalendarDayView } from "@/components/admin/painel/CalendarDayView";
import {
  addDays, endOfWeekSunday, formatRange, MONTH_NAMES,
  startOfDay, startOfWeekMonday, toISODate,
} from "@/components/admin/painel/dateUtils";

type ViewMode = "day" | "week" | "fortnight" | "month";
const PASS_KEY = "agenda.pass";
const VIEW_KEY = "agenda.view";

function normalizeKey(s: string | undefined | null): string {
  return (s || "").trim().toLowerCase();
}

function AgendaContent({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [mode, setMode] = useState<ViewMode>(
    () => (localStorage.getItem(VIEW_KEY) as ViewMode) || "week",
  );
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [statusFilter, setStatusFilter] = useState<AtendimentoStatus | "all">("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Atendimento | null>(null);

  useEffect(() => { localStorage.setItem(VIEW_KEY, mode); }, [mode]);

  const { from, to, title, periodLabel } = useMemo(() => {
    if (mode === "day") {
      const next = addDays(anchor, 1);
      return { from: toISODate(anchor), to: toISODate(next), title: formatRange(anchor, next), periodLabel: formatRange(anchor, next) };
    }
    if (mode === "week") {
      const s = startOfWeekMonday(anchor);
      const e = endOfWeekSunday(anchor);
      return { from: toISODate(s), to: toISODate(e), title: `Semana ${formatRange(s, e)}`, periodLabel: formatRange(s, e) };
    }
    if (mode === "fortnight") {
      const e = addDays(anchor, 14);
      return { from: toISODate(anchor), to: toISODate(e), title: formatRange(anchor, e), periodLabel: formatRange(anchor, e) };
    }
    const y = anchor.getFullYear(), m = anchor.getMonth();
    const s = new Date(y, m, 1);
    const e = new Date(y, m + 1, 0);
    return { from: toISODate(s), to: toISODate(e), title: `${MONTH_NAMES[m]} ${y}`, periodLabel: `${MONTH_NAMES[m]}/${y}` };
  }, [mode, anchor]);

  const { data: atendimentos = [], isLoading, error, refetch, isFetching, dataUpdatedAt } =
    useRbxAgendaPublic(from, to, password);

  // Listas únicas para filtros (derivadas dos dados)
  const cities = useMemo(() => {
    const set = new Map<string, string>();
    for (const a of atendimentos) {
      const k = normalizeKey(a.city);
      if (k && !set.has(k)) set.set(k, a.city as string);
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [atendimentos]);

  const technicians = useMemo(() => {
    const set = new Map<string, string>();
    for (const a of atendimentos) {
      const k = normalizeKey(a.technician);
      if (k && !set.has(k)) set.set(k, a.technician as string);
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [atendimentos]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return atendimentos.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (cityFilter !== "all" && normalizeKey(a.city) !== cityFilter) return false;
      if (techFilter !== "all" && normalizeKey(a.technician) !== techFilter) return false;
      if (s) {
        const hay = [a.customerName, a.protocol, a.customerPhone, a.address, a.type, a.reason]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [atendimentos, statusFilter, cityFilter, techFilter, search]);

  // KPIs
  const kpis = useMemo(() => {
    const todayISO = toISODate(startOfDay(new Date()));
    const counts = { aberto: 0, em_andamento: 0, concluido: 0, cancelado: 0 } as Record<AtendimentoStatus, number>;
    let hoje = 0;
    const cidadesSet = new Set<string>();
    for (const a of filtered) {
      counts[a.status]++;
      if (a.scheduledAt && toISODate(new Date(a.scheduledAt)) === todayISO) hoje++;
      if (a.city) cidadesSet.add(normalizeKey(a.city));
    }
    return { total: filtered.length, hoje, counts, cidades: cidadesSet.size };
  }, [filtered]);

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

  const clearFilters = () => {
    setStatusFilter("all"); setCityFilter("all"); setTechFilter("all"); setSearch("");
  };
  const hasActiveFilter =
    statusFilter !== "all" || cityFilter !== "all" || techFilter !== "all" || search.trim() !== "";

  // "atualizado há"
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  const updatedAgo = dataUpdatedAt ? Math.max(0, Math.round((now - dataUpdatedAt) / 1000)) : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <AgendaNavbar onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Agendamentos" value={kpis.total} sub={`Período ${periodLabel}`} />
          <KpiCard label="Hoje" value={kpis.hoje} sub="Agendados para hoje" highlight />
          <KpiCard label="Em andamento" value={kpis.counts.em_andamento} sub="Status atual" />
          <KpiCard label="Cidades" value={kpis.cidades} sub="Cobertas no filtro" />
        </div>

        {/* Filtros */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4 text-primary" /> Filtros
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {updatedAgo != null && (
                <span>Atualizado há {updatedAgo < 60 ? `${updatedAgo}s` : `${Math.round(updatedAgo / 60)}min`}</span>
              )}
              <Button
                size="sm" variant="outline"
                onClick={() => refetch()} disabled={isFetching}
                className="gap-1.5 h-8"
              >
                {isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Atualizar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Buscar</label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cliente, protocolo, telefone…"
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={normalizeKey(c)}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Técnico/Equipe</label>
              <Select value={techFilter} onValueChange={setTechFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Todos os técnicos</SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t} value={normalizeKey(t)}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AtendimentoStatus | "all")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilter && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
              <Button size="sm" variant="ghost" onClick={clearFilters} className="h-7 text-xs gap-1">
                <X className="h-3 w-3" /> Limpar filtros
              </Button>
            </div>
          )}
        </Card>

        {/* Calendário */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
              <h3 className="text-base font-semibold min-w-[200px] text-center capitalize">{title}</h3>
              <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">Hoje</Button>
            </div>
            <ToggleGroup
              type="single" value={mode}
              onValueChange={(v) => v && setMode(v as ViewMode)}
              variant="outline" size="sm"
            >
              <ToggleGroupItem value="day" className="text-xs px-3">Dia</ToggleGroupItem>
              <ToggleGroupItem value="week" className="text-xs px-3">Semana</ToggleGroupItem>
              <ToggleGroupItem value="fortnight" className="text-xs px-3">15 dias</ToggleGroupItem>
              <ToggleGroupItem value="month" className="text-xs px-3">Mês</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Não foi possível carregar agendamentos</p>
                <p className="text-xs text-muted-foreground mt-0.5">{(error as Error).message}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando agendamentos…
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

          {!isLoading && !error && filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhum agendamento encontrado para os filtros selecionados.
            </p>
          )}
        </Card>

        {/* Status legenda */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground pb-4">
          {STATUS_ORDER.map((s) => (
            <Badge key={s} variant="outline" className={`${STATUS_META[s].chip} border gap-1.5`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}: {kpis.counts[s]}
            </Badge>
          ))}
        </div>
      </main>

      <AgendaAtendimentoDialog
        atendimento={selected} open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}

function KpiCard({
  label, value, sub, highlight,
}: { label: string; value: number; sub: string; highlight?: boolean }) {
  return (
    <Card className={`p-4 ${highlight ? "border-accent/50 bg-accent/5" : ""}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${highlight ? "text-accent" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1 truncate">{sub}</div>
    </Card>
  );
}

export default function AgendaPage() {
  const [password, setPassword] = useState<string | null>(
    () => (typeof window !== "undefined" ? sessionStorage.getItem(PASS_KEY) : null),
  );

  const handleUnlock = (p: string) => {
    sessionStorage.setItem(PASS_KEY, p);
    setPassword(p);
  };
  const handleLogout = () => {
    sessionStorage.removeItem(PASS_KEY);
    setPassword(null);
  };

  return (
    <>
      <Helmet>
        <title>Agenda Operacional · Jotazo</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {password
        ? <AgendaContent password={password} onLogout={handleLogout} />
        : <AgendaPasswordGate onUnlock={handleUnlock} />}
    </>
  );
}
