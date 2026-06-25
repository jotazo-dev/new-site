import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Loader2, QrCode, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOrderStatusPolling } from "@/hooks/useCheckoutPayment";

/** Returns "HH:MM:SS" (or "MM:SS" if <1h) for a given ms remaining. */
function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Hook: ticking countdown to a target date (1s). */
function useCountdown(target?: string | null) {
  const targetMs = useMemo(() => (target ? new Date(target).getTime() : 0), [target]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  const remaining = Math.max(0, targetMs - now);
  return { remaining, expired: targetMs > 0 && remaining === 0, hasTarget: targetMs > 0 };
}

export function PixPanel({
  orderId,
  qrBase64,
  qrString,
  expiresAt,
  onPaid,
}: {
  orderId: string;
  qrBase64?: string;
  qrString?: string;
  expiresAt?: string;
  onPaid: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { remaining, expired, hasTarget } = useCountdown(expiresAt);

  // Stop polling once expired to avoid useless requests.
  const { status } = useOrderStatusPolling(orderId, { intervalMs: 4000, enabled: !expired });

  const isPaid = status === "paid";
  const isExpired = expired || status === "expired" || status === "canceled";

  useEffect(() => { if (isPaid) onPaid(); }, [isPaid, onPaid]);

  const copy = async () => {
    if (!qrString) return;
    await navigator.clipboard.writeText(qrString);
    setCopied(true);
    toast.success("Código Pix copiado!");
    setTimeout(() => setCopied(false), 2500);
  };

  // Visual urgency: <60s pulses red.
  const urgent = hasTarget && !isPaid && !isExpired && remaining > 0 && remaining < 60_000;

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 text-center">
      <StatusBadge isPaid={isPaid} isExpired={isExpired} />

      <div>
        <h3 className="text-lg font-bold">
          {isPaid ? "Pagamento confirmado!" : isExpired ? "Pix expirado" : "Pague com Pix"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPaid
            ? "Recebemos seu pagamento. Redirecionando…"
            : isExpired
              ? "O tempo para pagamento acabou. Gere um novo Pix para continuar."
              : "Aponte a câmera do seu banco ou copie o código abaixo."}
        </p>
      </div>

      {!isPaid && !isExpired && (
        <>
          {qrBase64 ? (
            <img
              src={`data:image/png;base64,${qrBase64}`}
              alt="QR Code Pix"
              className="mx-auto h-56 w-56 rounded-lg border border-border bg-white p-2"
            />
          ) : (
            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg bg-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {qrString && (
            <div className="mx-auto max-w-md">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-left text-xs font-mono break-all">
                {qrString}
              </div>
              <Button variant="outline" className="mt-3 w-full" onClick={copy}>
                {copied ? <><Check className="mr-2 h-4 w-4" /> Copiado</> : <><Copy className="mr-2 h-4 w-4" /> Copiar código Pix</>}
              </Button>
            </div>
          )}

          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Aguardando confirmação automática…
            </div>
            {hasTarget && (
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[13px] font-semibold ${
                  urgent
                    ? "bg-destructive/10 text-destructive animate-pulse"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Expira em {formatCountdown(remaining)}
              </div>
            )}
            {expiresAt && (
              <div className="text-[11px]">
                ({new Date(expiresAt).toLocaleString("pt-BR")})
              </div>
            )}
          </div>
        </>
      )}

      {isPaid && (
        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Finalizando seu pedido…</span>
        </div>
      )}

      {isExpired && (
        <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
          <QrCode className="mr-2 h-4 w-4" /> Gerar novo Pix
        </Button>
      )}
    </div>
  );
}

function StatusBadge({ isPaid, isExpired }: { isPaid: boolean; isExpired: boolean }) {
  if (isPaid) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Pago
      </div>
    );
  }
  if (isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Expirado
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando pagamento
    </div>
  );
}
