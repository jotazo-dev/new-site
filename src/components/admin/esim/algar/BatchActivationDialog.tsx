import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Clock, Mail, MailX, FileDown, RefreshCw, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BatchItem } from "@/components/admin/esim/algar/runAlgarActivationBatch";

function fmtMsisdn(tn: string): string {
  const d = (tn || "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tn;
}

type Props = {
  open: boolean;
  items: BatchItem[];
  running: boolean;
  onRetry: () => void;
  onDownloadPdf: () => void;
  onNew: () => void;
  onClose: () => void;
};

export function BatchActivationDialog({ open, items, running, onRetry, onDownloadPdf, onNew, onClose }: Props) {
  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const finished = done + failed;
  const progress = total > 0 ? Math.round((finished / total) * 100) : 0;
  const hasFailures = failed > 0;
  const hasSuccess = done > 0;

  const title = useMemo(() => {
    if (running) return `Ativando linhas (${finished} de ${total})`;
    return `Ativação concluída — ${done} sucesso · ${failed} falha${failed === 1 ? "" : "s"}`;
  }, [running, finished, total, done, failed]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !running) onClose();
      }}
    >
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(e) => { if (running) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (running) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : (hasFailures ? <XCircle className="w-5 h-5 text-destructive" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />)}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Progress value={progress} className="h-2" />

          <div className="max-h-[60vh] overflow-auto space-y-2 pr-1">
            {items.map((it) => {
              const isDone = it.status === "done";
              const isFail = it.status === "failed";
              const isPending = it.status === "pending";
              const isRunning = !isDone && !isFail && !isPending;
              return (
                <div
                  key={it.index}
                  className={cn(
                    "rounded-lg border p-3 flex items-start gap-3",
                    isDone && "border-emerald-500/40 bg-emerald-500/5",
                    isFail && "border-destructive/40 bg-destructive/5",
                    isRunning && "border-primary/40 bg-primary/5",
                  )}
                >
                  <div className="mt-0.5">
                    {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {isFail && <XCircle className="w-5 h-5 text-destructive" />}
                    {isRunning && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                    {isPending && <Clock className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">{fmtMsisdn(it.line.tn) || "(sem número)"}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">{it.line.simType}</Badge>
                      {it.line.iccid && (
                        <span className="text-[11px] font-mono text-muted-foreground truncate">{it.line.iccid}</span>
                      )}
                    </div>
                    {it.subMsg && isRunning && (
                      <div className="text-xs text-muted-foreground mt-1">{it.subMsg}</div>
                    )}
                    {isDone && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        {it.emailStatus === "sent" && (<><Mail className="w-3 h-3 text-emerald-600" /> E-mail enviado</>)}
                        {it.emailStatus === "failed" && (<><MailX className="w-3 h-3 text-destructive" /> Falha no e-mail{it.emailError ? `: ${it.emailError}` : ""}</>)}
                        {it.emailStatus === "skipped" && (<><Mail className="w-3 h-3" /> Sem e-mail</>)}
                      </div>
                    )}
                    {isFail && it.error && (
                      <div className="text-xs text-destructive mt-1 break-words">{it.error}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {!running && hasSuccess && (
              <Button type="button" variant="outline" onClick={onDownloadPdf}>
                <FileDown className="w-4 h-4 mr-2" /> Baixar PDF
              </Button>
            )}
            {!running && hasFailures && (
              <Button type="button" variant="outline" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retentar falhas
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!running && (
              <>
                <Button type="button" variant="ghost" onClick={onClose}>
                  <X className="w-4 h-4 mr-2" /> Fechar
                </Button>
                <Button type="button" onClick={onNew} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" /> Nova ativação
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
