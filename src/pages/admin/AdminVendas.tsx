import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/plans";
import { useVendas, type VendaRow } from "@/hooks/useVendas";
import { VendasFiltersBar } from "@/components/admin/vendas/VendasFilters";
import { VendasTable } from "@/components/admin/vendas/VendasTable";
import { VendaDetailsDrawer } from "@/components/admin/vendas/VendaDetailsDrawer";
import { exportVendasCSV } from "@/lib/vendasExport";

export default function AdminVendas() {
  const { rows, total, loading, filters, setFilters, page, setPage, pageCount, reload } = useVendas();
  const [selected, setSelected] = useState<VendaRow | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const kpis = useMemo(() => {
    const paid = rows.filter((r) => r.status === "paid");
    const totalPaidCents = paid.reduce((s, r) => s + (r.total_cents || 0), 0);
    const pending = rows.filter((r) => r.status === "pending" || r.status === "authorized").length;
    const failed = rows.filter((r) => r.status === "failed" || r.provisioning_status === "failed").length;
    const ticket = paid.length ? Math.round(totalPaidCents / paid.length) : 0;
    return { totalPaidCents, paidCount: paid.length, ticket, pending, failed };
  }, [rows]);

  const onRefresh = async (o: VendaRow) => {
    if (!o.cielo_payment_id) return;
    setRefreshingId(o.id);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/checkout-poll-status?orderId=${o.id}`;
      const r = await fetch(url, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const j = await r.json();
      toast.success(`Status: ${j.status || j.paymentStatus || "ok"}`);
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao consultar");
    } finally {
      setRefreshingId(null);
    }
  };

  const onReprovision = async (o: VendaRow) => {
    const { error } = await supabase.rpc("enqueue_provisioning", { _order_id: o.id });
    if (error) toast.error(error.message);
    else { toast.success("Reenfileirado!"); reload(); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 min-w-0 max-w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Todos os pedidos do site com status de pagamento e provisionamento.</p>
        </div>
        <Button variant="outline" onClick={() => exportVendasCSV(rows)}>
          <Download className="mr-1.5 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi label="Vendido (pago)" value={formatBRL(kpis.totalPaidCents)} accent="text-green-700" />
        <Kpi label="Pedidos pagos" value={String(kpis.paidCount)} />
        <Kpi label="Ticket médio" value={formatBRL(kpis.ticket)} />
        <Kpi label="Pendentes" value={String(kpis.pending)} accent="text-amber-700" />
        <Kpi label="Falhas" value={String(kpis.failed)} accent="text-red-700" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <VendasFiltersBar filters={filters} onChange={setFilters} onReload={reload} />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden min-w-0 max-w-full">
        <VendasTable
          rows={rows}
          loading={loading}
          onOpen={(o) => setSelected(o)}
          onRefresh={onRefresh}
          onReprovision={onReprovision}
          refreshingId={refreshingId}
        />
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <div>
            {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `${total} pedido(s) · página ${page + 1} / ${pageCount}`}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <VendaDetailsDrawer open={!!selected} onOpenChange={(v) => !v && setSelected(null)} order={selected} />
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent || ""}`}>{value}</div>
    </div>
  );
}
