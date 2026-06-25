import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCcw, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  total_cents: number;
  customer: any;
  customer_email: string | null;
  cielo_payment_id: string | null;
  installments: number | null;
  user_id: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  paid: "bg-green-500/15 text-green-700 border-green-200",
  pending: "bg-amber-500/15 text-amber-700 border-amber-200",
  authorized: "bg-blue-500/15 text-blue-700 border-blue-200",
  failed: "bg-red-500/15 text-red-700 border-red-200",
  canceled: "bg-gray-500/15 text-gray-700 border-gray-200",
  refunded: "bg-purple-500/15 text-purple-700 border-purple-200",
  expired: "bg-gray-500/15 text-gray-700 border-gray-200",
};

const METHOD_LABEL: Record<string, string> = {
  credit: "Crédito", debit: "Débito", pix: "Pix", boleto: "Boleto",
};

export default function AdminCheckoutPedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("checkout_orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (statusFilter) q = q.eq("status", statusFilter as any);
    if (accountFilter === "with") q = q.not("user_id", "is", null);
    if (accountFilter === "without") q = q.is("user_id", null);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter, accountFilter]);

  const refresh = async (id: string) => {
    setRefreshingId(id);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/checkout-poll-status?orderId=${id}`;
      const r = await fetch(url, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const j = await r.json();
      toast.success(`Status: ${j.status}`);
      load();
    } finally { setRefreshingId(null); }
  };

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(s) ||
      o.customer_email?.toLowerCase().includes(s) ||
      o.customer?.name?.toLowerCase().includes(s) ||
      o.cielo_payment_id?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos do Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">Pedidos criados pelo /checkoutv2 com pagamento via Cielo.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por e-mail, nome, ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.keys(STATUS_COLOR).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todas as contas</option>
          <option value="with">Com conta no site</option>
          <option value="without">Sem conta (visitante)</option>
        </select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCcw className="mr-1.5 h-4 w-4" /> Atualizar</Button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-10 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Pedido</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Conta</th>
                  <th className="px-4 py-3 text-left">Método</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customer?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {o.user_id ? (
                        <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-200">Vinculado</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/15 text-gray-600 border-gray-200">Visitante</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {METHOD_LABEL[o.payment_method] || o.payment_method}
                      {o.payment_method === "credit" && o.installments && o.installments > 1 && ` ${o.installments}x`}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatBRL(o.total_cents)}</td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLOR[o.status] || ""} variant="outline">{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {o.cielo_payment_id && (
                          <Button size="icon" variant="ghost" disabled={refreshingId === o.id} onClick={() => refresh(o.id)} title="Reconsultar Cielo">
                            {refreshingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button asChild size="icon" variant="ghost">
                          <a href={`/checkoutv2/sucesso/${o.id}`} target="_blank" rel="noreferrer" title="Ver pedido">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
