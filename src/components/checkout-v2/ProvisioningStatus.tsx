import { useEffect, useState } from "react";
import { Loader2, Smartphone, QrCode, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type OrderStatusSnapshot = {
  paymentStatus?: string;
  provisioningStatus?: string;
  provisioningError?: string | null;
  provisionedAt?: string | null;
  line?: {
    simKind?: "esim" | "physical" | null;
    msisdn?: string | null;
    iccid?: string | null;
    esimQrUrl?: string | null;
    esimActivationCode?: string | null;
    trackingCode?: string | null;
  };
};

export function useOrderProvisioningPolling(orderId: string | null, enabled = true) {
  const [data, setData] = useState<OrderStatusSnapshot | null>(null);
  useEffect(() => {
    if (!orderId || !enabled) return;
    let cancelled = false;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const statusUrl = `https://${projectId}.supabase.co/functions/v1/checkout-order-status?orderId=${encodeURIComponent(orderId)}`;
    const pollUrl = `https://${projectId}.supabase.co/functions/v1/checkout-poll-status?orderId=${encodeURIComponent(orderId)}`;
    const headers = { apikey, Authorization: `Bearer ${apikey}` };

    const tick = async () => {
      try {
        const res = await fetch(statusUrl, { headers });
        const json = await res.json();
        if (cancelled) return;
        if (json?.ok) setData(json);
        // Enquanto o pagamento não está confirmado, força o provider a ser consultado
        // (não depende só do webhook chegar). Best-effort, ignora erros.
        if (json?.paymentStatus && json.paymentStatus !== "paid" && json.paymentStatus !== "canceled" && json.paymentStatus !== "refunded") {
          fetch(pollUrl, { headers }).catch(() => {});
        }
      } catch { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [orderId, enabled]);
  return data;
}

export function ProvisioningStatus({ snapshot }: { snapshot: OrderStatusSnapshot | null }) {
  if (!snapshot) return null;
  const p = snapshot.provisioningStatus;
  const line = snapshot.line || {};

  if (p === "provisioned" && line.msisdn) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-5 text-left">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <h3 className="font-bold text-foreground">Sua linha está ativa!</h3>
        </div>
        <p className="text-sm">
          Número: <strong className="text-base">{formatPhone(line.msisdn)}</strong>
        </p>
        {line.simKind === "esim" && line.esimQrUrl && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-white p-4">
            <img src={line.esimQrUrl} alt="QR Code do eSIM" className="w-48 h-48" />
            {line.esimActivationCode && (
              <code className="text-xs break-all text-center">{line.esimActivationCode}</code>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Escaneie no app de configuração da sua operadora ou em Configurações → Celular → Adicionar eSIM.
            </p>
          </div>
        )}
        {line.simKind === "physical" && (
          <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4 mt-0.5" />
            <span>
              Seu chip foi separado para envio. {line.trackingCode ? <>Rastreio: <strong>{line.trackingCode}</strong></> : "Em breve enviaremos o código de rastreio."}
            </span>
          </div>
        )}
        {line.iccid && (
          <p className="mt-2 text-xs text-muted-foreground">ICCID: <span className="font-mono">{line.iccid}</span></p>
        )}
      </div>
    );
  }

  if (p === "manual_review" || p === "failed") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-left">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h3 className="font-bold">Precisamos revisar sua ativação</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Nosso time já foi notificado e entrará em contato em até 1 dia útil pelo WhatsApp ou e-mail cadastrado. Seu pagamento está confirmado.
        </p>
      </div>
    );
  }

  // queued / running / not_started → loading
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-left">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div>
          <h3 className="font-bold">Ativando sua linha…</h3>
          <p className="text-sm text-muted-foreground">Isso costuma levar menos de 1 minuto. Você pode fechar esta página — enviaremos um e-mail quando estiver pronto.</p>
        </div>
      </div>
    </div>
  );
}

function formatPhone(d: string) {
  const x = d.replace(/\D/g, "");
  if (x.length === 11) return `(${x.slice(0,2)}) ${x.slice(2,7)}-${x.slice(7)}`;
  if (x.length === 10) return `(${x.slice(0,2)}) ${x.slice(2,6)}-${x.slice(6)}`;
  return d;
}

// keep import to silence unused warning if needed downstream
void supabase;
