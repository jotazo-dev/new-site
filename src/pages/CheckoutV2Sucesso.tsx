import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/plans";
import { useOrderStatusPolling } from "@/hooks/useCheckoutPayment";
import { ProvisioningStatus, useOrderProvisioningPolling } from "@/components/checkout-v2/ProvisioningStatus";

export default function CheckoutV2Sucesso() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { status } = useOrderStatusPolling(orderId || null, {
    intervalMs: 6000,
    enabled: !!order && ["pending", "authorized"].includes(order?.status),
  });

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("checkout_orders").select("*").eq("id", orderId).maybeSingle();
      if (active) { setOrder(data); setLoading(false); }
    };
    load();
    const i = setInterval(load, 8000);
    return () => { active = false; clearInterval(i); };
  }, [orderId, status]);

  const isPaid = order?.status === "paid";
  // Once paid, also poll provisioning until terminal.
  const provisioning = useOrderProvisioningPolling(
    orderId || null,
    isPaid && order?.sim_kind && order?.provisioning_status !== "provisioned" && order?.provisioning_status !== "manual_review",
  );

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Carregando…</div>;
  if (!order) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Pedido não encontrado.</div>;

  const isPending = ["pending", "authorized"].includes(order.status);
  const isFailed = ["failed", "canceled", "expired"].includes(order.status);

  const Icon = isPaid ? CheckCircle2 : isPending ? Clock : XCircle;
  const iconColor = isPaid ? "text-[#25D366]" : isPending ? "text-amber-500" : "text-destructive";
  const title = isPaid ? "Pagamento confirmado!" : isPending ? "Aguardando confirmação" : "Pagamento não concluído";

  // Combine live provisioning snapshot with order row (for fresh data after refresh).
  const snapshot = provisioning ?? (isPaid && order.sim_kind ? {
    paymentStatus: order.status,
    provisioningStatus: order.provisioning_status,
    provisioningError: order.provisioning_last_error,
    provisionedAt: order.provisioned_at,
    line: {
      simKind: order.sim_kind,
      msisdn: order.msisdn,
      iccid: order.iccid,
      esimQrUrl: order.esim_qr_url,
      esimActivationCode: order.esim_activation_code,
      trackingCode: order.tracking_code,
    },
  } : null);

  return (
    <>
      <SEOHead title={`${title} — Jotazo Telecom`} description="Status do pedido." path={`/checkoutv2/sucesso/${orderId}`} noindex />
      <div className="bg-muted/20 min-h-screen py-12">
        <div className="mx-auto max-w-2xl px-4 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <Icon className={`mx-auto h-16 w-16 ${iconColor}`} />
            <h1 className="mt-4 text-2xl font-bold">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pedido <span className="font-mono">{order.id.slice(0, 8)}</span> · Total {formatBRL(order.total_cents)}
            </p>

            {isPaid && (
              <p className="mt-4 text-sm text-muted-foreground">
                Enviamos a confirmação para <strong>{order.customer_email}</strong>.
              </p>
            )}

            {isPending && order.payment_method === "boleto" && order.boleto_url && (
              <div className="mt-6">
                <Button asChild><a href={order.boleto_url} target="_blank" rel="noreferrer"><FileText className="mr-2 h-4 w-4" /> Abrir boleto</a></Button>
                {order.boleto_digitable_line && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-left font-mono text-xs break-all">
                    {order.boleto_digitable_line}
                  </div>
                )}
              </div>
            )}

            {isPending && order.payment_method === "pix" && order.pix_qr_string && (
              <div className="mt-6 text-left">
                <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs break-all">
                  {order.pix_qr_string}
                </div>
              </div>
            )}

            {isFailed && (
              <p className="mt-4 text-sm text-destructive">
                Tente novamente ou escolha outro método de pagamento.
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="outline"><Link to="/"><Home className="mr-2 h-4 w-4" /> Início</Link></Button>
              {isFailed && <Button asChild><Link to="/checkoutv2">Tentar novamente</Link></Button>}
            </div>
          </div>

          {isPaid && order.sim_kind && (
            <ProvisioningStatus snapshot={snapshot} />
          )}
        </div>
      </div>
    </>
  );
}
