import { ArrowLeft, Copy, Download, FileText, Loader2, QrCode, RotateCcw, CreditCard, Receipt, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { useInvoiceDetails, type Invoice } from "@/hooks/useMinhaContaInvoices";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDateBR(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function formatReference(ref: string) {
  const m = ref.match(/^(\d{4})-(\d{2})/);
  if (!m) return ref;
  const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  return `${months[Number(m[2]) - 1] ?? m[2]}/${m[1]}`;
}

export function InvoiceDetailsInline({
  invoice,
  onBack,
}: {
  invoice: Invoice;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { data, loading, error, refetch } = useInvoiceDetails(invoice.id);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copiado`, description: "Cole no app do seu banco." });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const downloadBoleto = () => {
    if (!data?.boleto) return;
    if (data.boleto.pdfUrl) {
      window.open(data.boleto.pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (data.boleto.pdfBase64) {
      const a = document.createElement("a");
      a.href = `data:application/pdf;base64,${data.boleto.pdfBase64}`;
      a.download = `boleto-${invoice.reference || "fatura"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const shareWhatsApp = (type: "pix" | "boleto" | "qr") => {
    const amount = formatBRL(invoice.amountCents);
    const date = formatDateBR(invoice.dueDate);
    let message = "";

    if (type === "pix" && data?.pix?.copiaCola) {
      message = `*Jotazo Telecom - Pagamento PIX* ⚡\n\n` +
                `💰 *Valor:* ${amount}\n` +
                `📅 *Vencimento:* ${date}\n\n` +
                `*Copia e Cola:* 👇\n` +
                `${data.pix.copiaCola}\n\n` +
                `_Basta copiar o código acima e colar no app do seu banco._`;
    } else if (type === "qr" && data?.pix?.qrCodeBase64) {
      message = `*Jotazo Telecom - QR Code PIX* 📸\n\n` +
                `💰 *Valor:* ${amount}\n` +
                `📅 *Vencimento:* ${date}\n\n` +
                `🖼️ *QR Code:* 👇\n` +
                `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.pix.copiaCola || "")}\n\n` +
                `_Abra o link acima para visualizar o QR Code e aponte a câmera do banco._`;
    } else if (type === "boleto") {
      const barcodeText = data?.barcode ? `\n*Linha Digitável:* 👇\n${data.barcode}\n` : "";
      const pdfText = data?.boleto?.pdfUrl ? `\n*Link do PDF:* 📄\n${data.boleto.pdfUrl}\n` : "";
      
      message = `*Jotazo Telecom - Boleto* 📑\n\n` +
                `💰 *Valor:* ${amount}\n` +
                `📅 *Vencimento:* ${date}\n` +
                barcodeText +
                pdfText;
    }

    if (message) {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para faturas
      </Button>

      {/* Resumo da Fatura */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <Card className="relative p-6 rounded-2xl border-none shadow-xl bg-background/95 backdrop-blur-sm overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight capitalize" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatReference(invoice.reference)}
              </h2>
              <p className="text-sm text-muted-foreground font-medium">Vence em {formatDateBR(invoice.dueDate)}</p>
              {invoice.plano && (
                <Badge variant="outline" className="mt-2 bg-primary/5 text-primary border-primary/10 text-[10px] uppercase font-bold tracking-wider">
                  Plano: {invoice.plano}
                </Badge>
              )}
            </div>
            <InvoiceStatusBadge status={invoice.status} label={invoice.statusLabel} />
          </div>
          <div className="flex items-end justify-between border-t border-muted/50 pt-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Total da Fatura</span>
              <div className="text-3xl font-bold tabular-nums text-foreground tracking-tight">
                {formatBRL(invoice.amountCents)}
              </div>
            </div>
            {!loading && !error && data?.paid && (
               <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-1.5 px-3">
                 Paga em {formatDateBR(invoice.dueDate)}
               </Badge>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 space-y-6 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative bg-background p-6 rounded-3xl border shadow-xl">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-bounce" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Gerando PIX e Boleto...
              </h3>
              <p className="text-sm text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                Estamos consultando a integração com a RBX para gerar seus dados de pagamento com segurança.
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <Card className="p-6 text-center border-destructive/20 bg-destructive/5 text-destructive rounded-2xl">
            <p className="font-medium mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch}>Tentar novamente</Button>
          </Card>
        )}

        {!loading && !error && data && data.paid && (
          <div className="p-8 text-center space-y-4 bg-muted/30 rounded-2xl border-2 border-dashed">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Fatura Liquidada</h3>
              <p className="text-sm text-muted-foreground mt-1">Obrigado! O pagamento desta fatura já foi confirmado e não há 2ª via pendente.</p>
            </div>
          </div>
        )}

        {!loading && !error && data && !data.paid && (
          <Tabs defaultValue="pix" className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-12 p-1 bg-muted/50 rounded-xl mb-6">
              <TabsTrigger value="pix" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <QrCode className="h-4 w-4 mr-2" /> PIX
              </TabsTrigger>
              <TabsTrigger value="boleto" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Receipt className="h-4 w-4 mr-2" /> Boleto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pix" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
              {data.pix && (data.pix.copiaCola || data.pix.qrCodeBase64) ? (
                <Card className="p-6 rounded-2xl space-y-6 border-muted/50">
                  {data.pix.qrCodeBase64 && (
                    <div className="space-y-4">
                      <p className="text-center text-sm font-semibold text-muted-foreground font-medium uppercase tracking-wider">Aponte a câmera para pagar</p>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative group p-2 bg-white rounded-2xl shadow-inner border-4 border-muted/20">
                          <img
                            src={`data:image/png;base64,${data.pix.qrCodeBase64}`}
                            alt="QR Code PIX"
                            className="w-56 h-56 transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareWhatsApp("qr")}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg h-8"
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1.5" /> Compartilhar imagem QR Code
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {data.pix.copiaCola && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código Copia e Cola</p>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4">Seguro</Badge>
                      </div>
                      <div className="relative group">
                        <div className="font-mono text-xs break-all leading-relaxed bg-muted/50 p-4 rounded-xl border border-muted pr-12 h-20 overflow-hidden">
                          {data.pix.copiaCola}
                          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-muted/50 to-transparent pointer-events-none" />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copy(data.pix!.copiaCola!, "PIX Copia e Cola")}
                          className="absolute top-2 right-2 h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => copy(data.pix!.copiaCola!, "PIX Copia e Cola")}
                        className="w-full h-12 font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: "#25D366", color: "white" }}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copiar Código PIX
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => shareWhatsApp("pix")}
                        className="w-full h-12 font-bold rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                      >
                        <Share2 className="h-4 w-4 mr-2" /> Compartilhar PIX
                      </Button>
                    </div>
                  )}
                </Card>
              ) : (
                <div className="p-8 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                   <p className="text-sm text-muted-foreground">PIX temporariamente indisponível para esta fatura.</p>
                   <Button variant="ghost" size="sm" onClick={refetch} className="mt-2 text-primary font-semibold">Tentar carregar agora</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="boleto" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
               {/* PDF Download */}
               {data.boleto && (data.boleto.pdfUrl || data.boleto.pdfBase64) ? (
                <div className="relative group">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
                   <Card className="relative p-6 rounded-2xl border-muted/50 flex flex-col items-center text-center space-y-4 overflow-hidden">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Boleto Bancário (PDF)</h3>
                        <p className="text-sm text-muted-foreground">Download da 2ª via oficial para impressão ou pagamento.</p>
                      </div>
                      <Button onClick={downloadBoleto} className="w-full h-12 font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-primary/20" size="lg">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF agora
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => shareWhatsApp("boleto")}
                        className="w-full h-12 font-bold rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                      >
                        <Share2 className="h-4 w-4 mr-2" /> Compartilhar PDF boleto
                      </Button>
                   </Card>
                </div>
              ) : (
                <Card className="p-4 rounded-2xl bg-amber-500/5 border-amber-500/10 flex flex-col items-center text-center gap-3">
                  <FileText className="h-10 w-10 text-amber-500/40" />
                  <p className="text-xs font-medium text-amber-800/70 max-w-[240px]">
                    PDF indisponível no momento {data.errors?.boleto ? `(${data.errors.boleto})` : ""}.
                  </p>
                  <Button variant="ghost" size="sm" className="h-8 text-amber-600 hover:bg-amber-100" onClick={refetch}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Tentar novamente
                  </Button>
                </Card>
              )}

              {data.barcode && (
                <Card className="p-6 rounded-2xl space-y-4 border-muted/50">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Linha Digitável</p>
                    <p className="font-mono text-sm break-all leading-relaxed bg-muted/30 p-4 rounded-xl border border-muted/50">
                      {data.barcode}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => copy(data.barcode!, "Código de barras")} className="w-full h-12 font-bold rounded-xl transition-all hover:bg-muted/80">
                    <Copy className="h-4 w-4 mr-2" /> Copiar Código de Barras
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!loading && !error && data && !data.paid && !data.boleto && !data.barcode && !data.pix && (
          <div className="p-12 text-center space-y-4 bg-muted/30 rounded-2xl border-2 border-dashed">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
              Aguardando sincronização de pagamento. Tente novamente em alguns instantes ou fale conosco.
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>Atualizar página</Button>
          </div>
        )}
      </div>
    </div>
  );
}
