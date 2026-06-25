import { Loader2, CheckCircle2, XCircle, Circle, Download, RotateCcw, MinusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export type OrderStep = {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
};

export type OrderResultSummary = {
  customerName: string;
  document: string;
  productName?: string | null;
  tn?: string;
  iccid?: string | null;
  simType?: string | null;
  rbxClienteCodigo?: string;
  rbxContratoCodigo?: string;
  rbxOsCodigo?: string;
  activationCode?: string | null;
};

interface Props {
  open: boolean;
  steps: OrderStep[];
  finished: boolean;
  hasFailure: boolean;
  summary?: OrderResultSummary | null;
  onClose: () => void;
  onDownloadPdf?: () => void;
  onNewOrder?: () => void;
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "running") return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
  if (status === "done") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === "failed") return <XCircle className="h-5 w-5 text-destructive" />;
  if (status === "skipped") return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
  return <Circle className="h-5 w-5 text-muted-foreground/40" />;
}

export function OrderProgressDialog({
  open, steps, finished, hasFailure, summary, onClose, onDownloadPdf, onNewOrder,
}: Props) {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.status === "done" || s.status === "skipped" || s.status === "failed").length;
  const progressValue = total ? (doneCount / total) * 100 : 0;
  const running = steps.some((s) => s.status === "running");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !running) onClose(); }}>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => { if (running) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (running) e.preventDefault(); }}
      >
        <DialogTitle className="sr-only">Gerando pedido</DialogTitle>

        {!finished ? (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
              <h2 className="text-lg font-semibold">Gerando pedido…</h2>
              <p className="text-xs text-muted-foreground">Não feche esta janela enquanto o sistema trabalha.</p>
            </div>

            <Progress value={progressValue} className="h-2" />

            <ul className="space-y-2.5">
              {steps.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    s.status === "running" && "border-primary/30 bg-primary/[0.04]",
                    s.status === "done" && "border-emerald-500/20 bg-emerald-500/[0.04]",
                    s.status === "failed" && "border-destructive/30 bg-destructive/[0.04]",
                  )}
                >
                  <StepIcon status={s.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight">{s.label}</div>
                    {s.detail && <div className="text-[11px] text-muted-foreground mt-0.5 break-words">{s.detail}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div
                className={cn(
                  "mx-auto h-16 w-16 rounded-full flex items-center justify-center animate-scale-in",
                  hasFailure ? "bg-amber-500/15" : "bg-emerald-500/15",
                )}
              >
                {hasFailure
                  ? <XCircle className="h-9 w-9 text-amber-600" />
                  : <CheckCircle2 className="h-9 w-9 text-emerald-600" />}
              </div>
              <h2 className="text-xl font-bold">
                {hasFailure ? "Pedido concluído com avisos" : "Pedido concluído!"}
              </h2>
              {hasFailure && (
                <p className="text-xs text-muted-foreground">
                  A linha foi ativada, mas houve falha em alguma etapa RBX. Verifique os detalhes abaixo.
                </p>
              )}
            </div>

            {/* steps summary compact */}
            <ul className="space-y-1.5 text-xs">
              {steps.map((s) => (
                <li key={s.id} className="flex items-start gap-2">
                  <StepIcon status={s.status} />
                  <div className="flex-1">
                    <span className="font-medium">{s.label}</span>
                    {s.detail && <span className="text-muted-foreground"> — {s.detail}</span>}
                  </div>
                </li>
              ))}
            </ul>

            {summary && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5 text-sm">
                <div className="font-semibold text-base mb-2">Detalhes do pedido</div>
                <Row label="Cliente" value={summary.customerName} />
                <Row label="Documento" value={summary.document} />
                {summary.productName && <Row label="Plano" value={summary.productName} />}
                {summary.tn && <Row label="Número" value={summary.tn} mono />}
                {summary.iccid && <Row label="ICCID" value={summary.iccid} mono />}
                {summary.simType && <Row label="Chip" value={summary.simType === "esim" ? "eSIM" : "SIM físico"} />}
                {summary.rbxClienteCodigo && <Row label="Cliente RBX" value={summary.rbxClienteCodigo} mono />}
                {summary.rbxContratoCodigo && <Row label="Contrato RBX" value={summary.rbxContratoCodigo} mono />}
                {summary.rbxOsCodigo && <Row label="OS RBX" value={summary.rbxOsCodigo} mono />}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {onDownloadPdf && (
                <Button onClick={onDownloadPdf} className="flex-1 gap-2">
                  <Download className="h-4 w-4" /> Baixar PDF do pedido
                </Button>
              )}
              {onNewOrder && (
                <Button variant="outline" onClick={onNewOrder} className="flex-1 gap-2">
                  <RotateCcw className="h-4 w-4" /> Novo pedido
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={cn("text-right break-all", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
