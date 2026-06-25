import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { formatBRL } from "@/data/plans";
import { toast } from "sonner";

type Order = {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  total_cents: number;
  provisioning_status: string | null;
  items: any;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  paid: { label: "Pago", cls: "bg-green-500/15 text-green-700 border-green-200" },
  pending: { label: "Aguardando pagamento", cls: "bg-amber-500/15 text-amber-700 border-amber-200" },
  authorized: { label: "Autorizado", cls: "bg-blue-500/15 text-blue-700 border-blue-200" },
  failed: { label: "Falhou", cls: "bg-red-500/15 text-red-700 border-red-200" },
  canceled: { label: "Cancelado", cls: "bg-gray-500/15 text-gray-700 border-gray-200" },
  refunded: { label: "Reembolsado", cls: "bg-purple-500/15 text-purple-700 border-purple-200" },
  expired: { label: "Expirado", cls: "bg-gray-500/15 text-gray-700 border-gray-200" },
};

const METHOD_LABEL: Record<string, string> = {
  credit: "Cartão de crédito", debit: "Cartão de débito", pix: "Pix", boleto: "Boleto",
};

export default function ContaPedidos() {
  const { user } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reclaiming, setReclaiming] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("checkout_orders")
      .select("id,created_at,status,payment_method,total_cents,provisioning_status,items")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const reclaim = async () => {
    if (!user) return;
    setReclaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_orders_for_customer", { _user_id: user.id });
      if (error) throw error;
      const n = (data as number) ?? 0;
      toast.success(n > 0 ? `${n} pedido(s) vinculado(s) à sua conta` : "Nenhum pedido adicional encontrado");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível buscar pedidos");
    } finally {
      setReclaiming(false);
    }
  };

  return (
    <>
      <Helmet><title>Meus pedidos — Jotazo</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Meus pedidos</h1>
            <p className="text-sm text-muted-foreground">Histórico de compras feitas no site.</p>
          </div>
          <Button variant="outline" size="sm" onClick={reclaim} disabled={reclaiming}>
            {reclaiming ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
            Não vejo um pedido meu
          </Button>
        </div>

        {loading ? (
          <Card className="p-10 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </Card>
        ) : orders.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Você ainda não tem pedidos por aqui.</p>
            <p className="text-xs mt-2 opacity-70">Se já comprou conosco, clique em "Não vejo um pedido meu" para buscar pelo seu CPF.</p>
            <Link to="/" className="inline-block mt-4"><Button size="sm">Ver planos</Button></Link>
          </Card>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const st = STATUS_LABEL[o.status] ?? { label: o.status, cls: "" };
              const itemCount = Array.isArray(o.items) ? o.items.length : 0;
              return (
                <li key={o.id}>
                  <Link to={`/conta/pedidos/${o.id}`}>
                    <Card className="p-4 hover:border-primary transition-colors flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">Pedido #{o.id.slice(0, 8).toUpperCase()}</span>
                          <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(o.created_at).toLocaleString("pt-BR")} · {itemCount} {itemCount === 1 ? "item" : "itens"} · {METHOD_LABEL[o.payment_method] || o.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatBRL(o.total_cents)}</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
