import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCcw, AlertTriangle } from "lucide-react";
import type { VendasFilters } from "@/hooks/useVendas";

const STATUS = [
  { v: "paid", l: "Pago" },
  { v: "pending", l: "Aguardando" },
  { v: "authorized", l: "Autorizado" },
  { v: "failed", l: "Falhou" },
  { v: "canceled", l: "Cancelado" },
  { v: "refunded", l: "Estornado" },
  { v: "expired", l: "Expirado" },
];
const METHODS = [
  { v: "credit", l: "Crédito" },
  { v: "debit", l: "Débito" },
  { v: "pix", l: "Pix" },
  { v: "boleto", l: "Boleto" },
];
const PROV = [
  { v: "done", l: "Concluído" },
  { v: "in_progress", l: "Em andamento" },
  { v: "queued", l: "Na fila" },
  { v: "failed", l: "Falhou" },
  { v: "not_started", l: "Não iniciado" },
];

type Props = {
  filters: VendasFilters;
  onChange: (f: Partial<VendasFilters>) => void;
  onReload: () => void;
};

function MultiPill({ label, values, options, onChange }: {
  label: string;
  values: string[];
  options: { v: string; l: string }[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}:</span>
      {options.map((o) => {
        const active = values.includes(o.v);
        return (
          <button
            key={o.v}
            type="button"
            onClick={() =>
              onChange(active ? values.filter((x) => x !== o.v) : [...values, o.v])
            }
            className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

export function VendasFiltersBar({ filters, onChange, onReload }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, e-mail, WhatsApp, ID, Cielo, MSISDN…"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["today", "7d", "30d", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ rangePreset: p })}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                filters.rangePreset === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {p === "today" ? "Hoje" : p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "Tudo"}
            </button>
          ))}
        </div>
        <Button
          variant={filters.onlyErrors ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ onlyErrors: !filters.onlyErrors })}
        >
          <AlertTriangle className="mr-1.5 h-4 w-4" /> Só erros
        </Button>
        <Button variant="outline" size="sm" onClick={onReload}>
          <RefreshCcw className="mr-1.5 h-4 w-4" /> Atualizar
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <MultiPill
          label="Status"
          values={filters.status}
          options={STATUS}
          onChange={(v) => onChange({ status: v })}
        />
        <MultiPill
          label="Método"
          values={filters.method}
          options={METHODS}
          onChange={(v) => onChange({ method: v })}
        />
        <MultiPill
          label="Provisionamento"
          values={filters.provisioning}
          options={PROV}
          onChange={(v) => onChange({ provisioning: v })}
        />
      </div>
    </div>
  );
}
