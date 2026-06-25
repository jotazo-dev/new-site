import { useMemo, useState } from "react";
import { Search, Download, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CrmLead } from "./types";

export type Period = "all" | "today" | "7d" | "30d" | "90d";

export interface CrmFilterState {
  search: string;
  source: "all" | "website" | "whatsapp";
  period: Period;
  city: string;
  onlyRepeat: boolean;
}

export const DEFAULT_FILTERS: CrmFilterState = {
  search: "",
  source: "all",
  period: "all",
  city: "all",
  onlyRepeat: false,
};

interface CrmFiltersProps {
  filters: CrmFilterState;
  onChange: (next: CrmFilterState) => void;
  searchRef: React.RefObject<HTMLInputElement>;
  totalLeads: number;
  filteredLeads: CrmLead[];
  cityOptions: string[];
  onExport: () => void;
}

export function CrmFilters({
  filters,
  onChange,
  searchRef,
  totalLeads,
  filteredLeads,
  cityOptions,
  onExport,
}: CrmFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const update = (patch: Partial<CrmFilterState>) => onChange({ ...filters, ...patch });
  const isDirty = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.source !== "all" ||
      filters.period !== "all" ||
      filters.city !== "all" ||
      filters.onlyRepeat
    );
  }, [filters]);

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.source !== "all") n++;
    if (filters.period !== "all") n++;
    if (filters.city !== "all") n++;
    if (filters.onlyRepeat) n++;
    return n;
  }, [filters]);

  const periods: Array<{ id: Period; label: string }> = [
    { id: "all", label: "Tudo" },
    { id: "today", label: "Hoje" },
    { id: "7d", label: "7 dias" },
    { id: "30d", label: "30 dias" },
    { id: "90d", label: "90 dias" },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Buscar por nome, telefone, e-mail ou cidade…  (atalho: / )"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
        </Button>

        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>

        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}

        <Badge variant="outline" className="ml-auto">
          {filteredLeads.length} de {totalLeads} pedidos
        </Badge>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filters.source} onValueChange={(v) => update({ source: v as CrmFilterState["source"] })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="website">Site</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.city} onValueChange={(v) => update({ city: v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {cityOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
              <Switch
                id="only-repeat"
                checked={filters.onlyRepeat}
                onCheckedChange={(v) => update({ onlyRepeat: v })}
              />
              <Label htmlFor="only-repeat" className="cursor-pointer text-xs font-medium">
                Apenas recorrentes
              </Label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Período:
            </span>
            {periods.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update({ period: p.id })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filters.period === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function applyPeriod(leads: CrmLead[], period: Period): CrmLead[] {
  if (period === "all") return leads;
  const now = Date.now();
  const day = 86400000;
  const cutoff =
    period === "today"
      ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      : period === "7d"
        ? now - 7 * day
        : period === "30d"
          ? now - 30 * day
          : now - 90 * day;
  return leads.filter((l) => new Date(l.created_at).getTime() >= cutoff);
}
