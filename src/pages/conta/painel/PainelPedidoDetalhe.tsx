import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ExternalLink, Copy, Check, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { formatBRL } from "@/data/plans";
import { toast } from "sonner";

type Order = any;

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  paid: { label: "Pago", cls: "bg-green-500/15 text-green-700 border-green-200" },
  pending: { label: "Aguardando pagamento", cls: "bg-amber-500/15 text-amber-700 border-amber-200" },
  authorized: { label: "Autorizado", cls: "bg-blue-500/15 text-blue-700 border-blue-200" },
  failed: { label: "Falhou", cls: "bg-red-500/15 text-red-700 border-red-200" },
  canceled: { label: "Cancelado", cls: "bg-gray-500/15 text-gray-700 border-gray-200" },
  refunded: { label: "Reembolsado", cls: "bg-purple-500/15 text-purple-700 border-purple-200" },
  expired: { label: "Expirado", cls: "bg-gray-500/15 text-gray-700 border-gray-200" },
};

const PROV_LABEL: Record<string, string> = {
  not_started: "Aguardando pagamento",
  queued: "Na fila de ativação",
  in_progress: "Ativando linha",
  done: "Linha ativada ✅",
  failed: "Falha na ativação — falaremos com você",
};

const METHOD_LABEL: Record<string, string> = {
  credit: "Cartão de crédito", debit: "Cartão de débito", pix: "Pix", boleto: "Boleto",
};

export default function PainelPedidoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCustomerAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id || !user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("checkout_orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) toast.error(error.message);
      setOrder(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  if (loading) {
    return <Card className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>;
  }

  if (!order) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Pedido não encontrado.</p>
        <Button className="mt-4" size="sm" onClick={() => navigate("/conta/painel/pedidos")}>Voltar</Button>
      </Card>
    );
  }

  const st = STATUS_LABEL[order.status] ?? { label: order.status, cls: "" };
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const isPendingPayment = order.status === "pending" || order.status === "authorized";

  return (
    <>
      <Helmet><title>Pedido #{String(order.id).slice(0, 8).toUpperCase()} — Painel Jotazo</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="space-y-5">
        <Link to="/conta/painel/pedidos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Pedido #{String(order.id).slice(0, 8).toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground mt-1">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
          </div>
          <Badge variant="outline" className={st.cls}>{st.label}</Badge>
        </div>

        <Card className="p-5 space-y-3">
          <h2 className="font-medium">Itens</h2>
          <ul className="divide-y divide-border">
            {items.map((it: any, i: number) => (
              <li key={i} className="py-2 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{it.name}</div>
                  {it.category && <div className="text-xs text-muted-foreground">{it.category}</div>}
                </div>
                <div className="font-semibold">{formatBRL((it.unit_cents ?? 0) * (it.qty ?? 1))}</div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">{formatBRL(order.total_cents)}</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2 text-sm">
          <h2 className="font-medium">Pagamento</h2>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Método</span>
            <span>{METHOD_LABEL[order.payment_method] || order.payment_method}{order.payment_method === "credit" && order.installments && order.installments > 1 ? ` em ${order.installments}x` : ""}</span>
          </div>
          {order.paid_at && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pago em</span>
              <span>{new Date(order.paid_at).toLocaleString("pt-BR")}</span>
            </div>
          )}

          {isPendingPayment && order.payment_method === "pix" && order.pix_qr_string && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-muted-foreground">Pix copia e cola</div>
              <div className="flex gap-2">
                <code className="flex-1 truncate text-xs bg-muted rounded px-2 py-1.5">{order.pix_qr_string}</code>
                <Button size="sm" variant="outline" onClick={() => copy(order.pix_qr_string, "pix")}>
                  {copied === "pix" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {isPendingPayment && order.payment_method === "boleto" && (
            <div className="mt-3 space-y-2">
              {order.boleto_digitable_line && (
                <>
                  <div className="text-xs text-muted-foreground">Linha digitável</div>
                  <div className="flex gap-2">
                    <code className="flex-1 truncate text-xs bg-muted rounded px-2 py-1.5">{order.boleto_digitable_line}</code>
                    <Button size="sm" variant="outline" onClick={() => copy(order.boleto_digitable_line, "boleto")}>
                      {copied === "boleto" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
              {order.boleto_url && (
                <Button asChild size="sm" variant="outline" className="w-full">
                  <a href={order.boleto_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1.5" /> Abrir boleto</a>
                </Button>
              )}
            </div>
          )}

          {isPendingPayment && (
            <Button className="w-full mt-3" onClick={() => navigate("/checkoutv2")}>Retomar pagamento</Button>
          )}
        </Card>

        {order.provisioning_status && (
          <Card className="p-5 space-y-1 text-sm">
            <h2 className="font-medium">Ativação</h2>
            <p className="text-muted-foreground">{PROV_LABEL[order.provisioning_status] || order.provisioning_status}</p>
            {order.msisdn && <p className="text-xs">Número: <span className="font-mono">{order.msisdn}</span></p>}
            {order.tracking_code && <p className="text-xs">Rastreio: <span className="font-mono">{order.tracking_code}</span></p>}
          </Card>
        )}
      </div>
    </>
  );
}
