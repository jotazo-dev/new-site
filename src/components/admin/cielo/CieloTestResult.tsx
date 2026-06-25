import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { CieloPaymentTestResult } from "@/types/cielo";

const STATUS_LABEL: Record<number, string> = {
  0: "NotFinished", 1: "Authorized", 2: "PaymentConfirmed", 3: "Denied",
  10: "Voided", 11: "Refunded", 12: "Pending", 13: "Aborted",
};

function copy(v: string) {
  navigator.clipboard.writeText(v).then(() => toast.success("Copiado!"));
}

export function CieloTestResultView({ result, extra }: { result: CieloPaymentTestResult; extra?: React.ReactNode }) {
  const statusLabel = result.status != null ? `${result.status} ${STATUS_LABEL[result.status] ?? ""}` : "—";
  return (
    <div className={`rounded-lg border p-4 space-y-3 text-sm ${
      result.ok ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
    }`}>
      <div className="flex items-center gap-2 font-medium">
        {result.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
        <span>{result.ok ? "Transação criada" : "Falhou"}</span>
        {result.status != null && <Badge variant="outline">{statusLabel}</Badge>}
        {result.httpStatus && <Badge variant="secondary">HTTP {result.httpStatus}</Badge>}
        {result.providerUsed && <Badge variant="outline">Provider: {result.providerUsed}</Badge>}
        {result.errorCode != null && <Badge variant="destructive">Code {result.errorCode}</Badge>}
      </div>

      {result.returnMessage && (
        <p className="text-xs text-muted-foreground">{result.returnMessage}</p>
      )}
      {result.message && (
        <p className="text-xs font-medium text-destructive">{result.message}</p>
      )}
      {result.diagnostic && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/5 p-2 text-[11px] text-yellow-800 dark:text-yellow-300">
          <strong>Diagnóstico:</strong> {result.diagnostic}
        </div>
      )}

      {result.paymentId && (
        <Field label="PaymentId" value={result.paymentId} mono onCopy={() => copy(result.paymentId!)} />
      )}
      {result.authorizationCode && (
        <Field label="AuthorizationCode" value={result.authorizationCode} mono />
      )}
      {result.proofOfSale && <Field label="NSU (ProofOfSale)" value={result.proofOfSale} mono />}

      {result.qrCodeBase64 && (
        <div className="space-y-2">
          <p className="text-xs font-medium">QR Code Pix</p>
          <img
            src={result.qrCodeBase64.startsWith("data:") ? result.qrCodeBase64 : `data:image/png;base64,${result.qrCodeBase64}`}
            alt="QR Code Pix"
            className="h-48 w-48 rounded border bg-white p-2"
          />
        </div>
      )}
      {result.qrCodeString && (
        <Field label="Pix copia e cola" value={result.qrCodeString} mono small onCopy={() => copy(result.qrCodeString!)} />
      )}

      {result.digitableLine && (
        <Field label="Linha digitável" value={result.digitableLine} mono onCopy={() => copy(result.digitableLine!)} />
      )}
      {result.barCodeNumber && <Field label="Código de barras" value={result.barCodeNumber} mono small />}
      {result.boletoUrl && (
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={result.boletoUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Abrir boleto
          </a>
        </Button>
      )}

      {result.authenticationUrl && (
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={result.authenticationUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Abrir autenticação 3DS
          </a>
        </Button>
      )}

      {extra}

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Ver resposta completa</summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted/40 p-2 text-[11px]">
          {JSON.stringify(result.raw, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function Field({
  label, value, mono, small, onCopy,
}: { label: string; value: string; mono?: boolean; small?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${small ? "text-[11px]" : "text-xs"} break-all flex-1`}>
        {value}
      </span>
      {onCopy && (
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
