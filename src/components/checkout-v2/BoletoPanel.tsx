import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOrderStatusPolling } from "@/hooks/useCheckoutPayment";
import { useEffect } from "react";

export function BoletoPanel({
  orderId,
  url,
  digitableLine,
  dueDate,
  onPaid,
}: {
  orderId: string;
  url?: string;
  digitableLine?: string;
  dueDate?: string;
  onPaid: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { status } = useOrderStatusPolling(orderId, { intervalMs: 15000 });
  useEffect(() => { if (status === "paid") onPaid(); }, [status, onPaid]);

  const copy = async () => {
    if (!digitableLine) return;
    await navigator.clipboard.writeText(digitableLine);
    setCopied(true); toast.success("Linha digitável copiada!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 text-center">
      <div>
        <h3 className="text-lg font-bold">Boleto gerado</h3>
        {dueDate && <p className="mt-1 text-sm text-muted-foreground">Vencimento: {new Date(dueDate).toLocaleDateString("pt-BR")}</p>}
      </div>
      {digitableLine && (
        <div className="mx-auto max-w-xl">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-left font-mono text-xs break-all">
            {digitableLine}
          </div>
          <Button variant="outline" className="mt-3 w-full" onClick={copy}>
            {copied ? <><Check className="mr-2 h-4 w-4" /> Copiado</> : <><Copy className="mr-2 h-4 w-4" /> Copiar linha digitável</>}
          </Button>
        </div>
      )}
      {url && (
        <Button asChild className="w-full max-w-xs mx-auto">
          <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Abrir boleto (PDF)</a>
        </Button>
      )}
      <p className="text-xs text-muted-foreground">A compensação pode levar até 2 dias úteis após o pagamento.</p>
    </div>
  );
}
