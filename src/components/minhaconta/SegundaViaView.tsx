import { ArrowLeft, Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { useSecondCopy, type Invoice } from "@/hooks/useMinhaContaInvoices";
import { useToast } from "@/hooks/use-toast";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDateBR(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function SegundaViaView({ onBack }: { onBack: () => void }) {
  const { latest, expired, loading, error, refetch } = useSecondCopy();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">2ª Via de fatura</h2>
        <p className="text-sm text-muted-foreground">Baixe boleto ou copie o código PIX.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {!loading && error && (
        <Card className="p-6 text-sm text-muted-foreground">{error}</Card>
      )}

      {!loading && !error && !latest && expired.length === 0 && (
        <Card className="p-6 text-sm text-muted-foreground">
          Você está em dia! Nenhuma fatura disponível para 2ª via no momento.
        </Card>
      )}

      {!loading && !error && latest && (
        <FeaturedInvoice inv={latest} />
      )}

      {!loading && !error && expired.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Faturas vencidas
          </h3>
          {expired.map((inv) => <CompactInvoice key={inv.id} inv={inv} />)}
        </div>
      )}
    </div>
  );
}

function FeaturedInvoice({ inv }: { inv: Invoice }) {
  const { toast } = useToast();
  const copy = async (label: string, text?: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  return (
    <Card className="p-6 rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Fatura em destaque</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{formatBRL(inv.amountCents)}</p>
          <p className="text-sm text-muted-foreground">Vencimento {formatDateBR(inv.dueDate)}</p>
        </div>
        <InvoiceStatusBadge status={inv.status} label={inv.statusLabel} />
      </div>

      {inv.barcode && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Linha digitável</p>
          <div className="flex items-center gap-2 bg-background border rounded-lg p-2">
            <code className="text-xs font-mono truncate flex-1">{inv.barcode}</code>
            <Button size="sm" variant="ghost" onClick={() => copy("Código", inv.barcode)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {inv.downloadUrl && (
          <Button asChild>
            <a href={inv.downloadUrl} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4 mr-1" /> Baixar boleto
            </a>
          </Button>
        )}
        {inv.pixCode && (
          <Button variant="outline" onClick={() => copy("PIX", inv.pixCode)}>
            <Copy className="h-4 w-4 mr-1" /> Copiar PIX
          </Button>
        )}
      </div>
    </Card>
  );
}

function CompactInvoice({ inv }: { inv: Invoice }) {
  const { toast } = useToast();
  return (
    <Card className="p-4 rounded-xl flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{formatBRL(inv.amountCents)}</p>
        <p className="text-xs text-muted-foreground">Venceu em {formatDateBR(inv.dueDate)}</p>
      </div>
      <div className="flex items-center gap-2">
        <InvoiceStatusBadge status={inv.status} label={inv.statusLabel} />
        {inv.downloadUrl && (
          <Button size="sm" variant="outline" asChild>
            <a href={inv.downloadUrl} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
        {inv.barcode && (
          <Button size="sm" variant="ghost" onClick={async () => {
            await navigator.clipboard.writeText(inv.barcode!);
            toast({ title: "Código copiado!" });
          }}>
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
