import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceDetailsInline } from "./InvoiceDetailsInline";
import { useInvoicesList, type Invoice } from "@/hooks/useMinhaContaInvoices";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatReference(ref: string) {
  const m = ref.match(/^(\d{4})-(\d{2})/);
  if (!m) return ref;
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${months[Number(m[2]) - 1] ?? m[2]}/${m[1].slice(-2)}`;
}

export function FaturasView({ onBack }: { onBack: () => void }) {
  const { list, loading, error, refetch } = useInvoicesList();
  const [selected, setSelected] = useState<Invoice | null>(null);

  const groups = useMemo(() => {
    const all = list ?? [];
    const proximas = all
      .filter((i) => i.status === "open" || i.status === "future")
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 5);
    return {
      proximas,
      pagas: all.filter((i) => i.status === "paid"),
      atrasadas: all.filter((i) => i.status === "overdue"),
    };
  }, [list]);

  if (selected) {
    return <InvoiceDetailsInline invoice={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Faturas</h2>
        <p className="text-sm text-muted-foreground">Toque em uma fatura para ver detalhes e 2ª via.</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      )}

      {!loading && error && (
        <Card className="p-6 text-sm text-muted-foreground">{error}</Card>
      )}

      {!loading && !error && (
        <Tabs defaultValue="proximas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proximas">Próximas ({groups.proximas.length})</TabsTrigger>
            <TabsTrigger value="pagas">Pagas ({groups.pagas.length})</TabsTrigger>
            <TabsTrigger value="atrasadas">Atrasadas ({groups.atrasadas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="proximas"><InvoiceList items={groups.proximas} empty="Nenhuma fatura próxima." onSelect={setSelected} /></TabsContent>
          <TabsContent value="pagas"><InvoiceList items={groups.pagas} empty="Nenhuma fatura paga." onSelect={setSelected} /></TabsContent>
          <TabsContent value="atrasadas"><InvoiceList items={groups.atrasadas} empty="Nenhuma fatura atrasada." onSelect={setSelected} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function InvoiceList({ items, empty, onSelect }: { items: Invoice[]; empty: string; onSelect: (i: Invoice) => void }) {
  if (items.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground">{empty}</Card>;
  }
  return (
    <div className="space-y-2">
      {items.map((inv) => <InvoiceRow key={inv.id} inv={inv} onSelect={onSelect} />)}
    </div>
  );
}

function InvoiceRow({ inv, onSelect }: { inv: Invoice; onSelect: (i: Invoice) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(inv)}
      className="w-full text-left"
    >
      <Card className="p-4 rounded-xl flex items-center justify-between gap-4 transition-colors hover:bg-accent/50">
        <div className="min-w-0">
          <p className="text-sm font-semibold capitalize">{formatReference(inv.reference)}</p>
          <p className="text-xs text-muted-foreground">Vence em {formatDateBR(inv.dueDate)}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold tabular-nums">{formatBRL(inv.amountCents)}</span>
          <InvoiceStatusBadge status={inv.status} label={inv.statusLabel} />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </button>
  );
}
