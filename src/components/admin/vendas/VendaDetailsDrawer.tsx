import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { formatBRL } from "@/data/plans";
import { toast } from "sonner";
import type { VendaRow } from "@/hooks/useVendas";
import { STATUS_COLOR, METHOD_LABEL, PROV_COLOR, STATUS_LABEL, PROV_LABEL } from "./VendasTable";
import { VendaTimeline } from "./VendaTimeline";

type Props = { open: boolean; onOpenChange: (v: boolean) => void; order: VendaRow | null };

function Field({ label, value, mono }: { label: string; value?: any; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1 text-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-xs break-all" : "break-words"}>{String(value)}</div>
    </div>
  );
}

function CopyBtn({ value, label }: { value: string; label?: string }) {
  return (
    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label || "Copiado"}!`); }}>
      <Copy className="h-3 w-3" />
    </Button>
  );
}

export function VendaDetailsDrawer({ open, onOpenChange, order }: Props) {
  if (!order) return null;
  const o = order;
  const items: any[] = Array.isArray(o.items) ? o.items : [];
  const addr = o.shipping_address || {};
  const port = o.portability || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            Pedido #{o.id.slice(0, 8)}
            <Badge variant="outline" className={STATUS_COLOR[o.status] || ""}>{STATUS_LABEL[o.status] || o.status}</Badge>
            {o.provisioning_status && (
              <Badge variant="outline" className={PROV_COLOR[o.provisioning_status] || ""}>
                {PROV_LABEL[o.provisioning_status] || o.provisioning_status}
              </Badge>
            )}
          </SheetTitle>
          <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" asChild>
              <a href={`/checkoutv2/sucesso/${o.id}`} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Página de sucesso
              </a>
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="mt-4">
          <TabsList className="w-full overflow-x-auto justify-start">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="cliente">Cliente</TabsTrigger>
            <TabsTrigger value="itens">Itens</TabsTrigger>
            <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
            <TabsTrigger value="linha">Linha</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-1">
            <Field label="ID" value={o.id} mono />
            <Field label="Merchant Order" value={o.merchant_order_id} mono />
            <Field label="Criado" value={new Date(o.created_at).toLocaleString("pt-BR")} />
            <Field label="Pago em" value={o.paid_at ? new Date(o.paid_at).toLocaleString("pt-BR") : null} />
            <Field label="Provisionado" value={o.provisioned_at ? new Date(o.provisioned_at).toLocaleString("pt-BR") : null} />
            <Field label="Subtotal" value={formatBRL(o.subtotal_cents)} />
            {o.discount_cents ? <Field label="Desconto" value={formatBRL(o.discount_cents)} /> : null}
            <Field label="Total" value={formatBRL(o.total_cents)} />
          </TabsContent>

          <TabsContent value="cliente" className="space-y-1">
            <Field label="Nome" value={o.customer?.name} />
            <Field label="E-mail" value={o.customer_email} />
            <Field label="Telefone" value={o.customer?.phone} />
            <Field label="CPF/CNPJ" value={o.customer_doc} />
            <Field label="Nascimento" value={(o as any).customer_birthdate} />
            {addr && Object.keys(addr).length > 0 && (
              <div className="mt-3 rounded-lg border border-border p-3">
                <div className="text-xs uppercase text-muted-foreground mb-2">Endereço de entrega</div>
                <Field label="CEP" value={addr.zip || addr.cep} />
                <Field label="Logradouro" value={[addr.street, addr.number].filter(Boolean).join(", ")} />
                <Field label="Complemento" value={addr.complement} />
                <Field label="Bairro" value={addr.neighborhood} />
                <Field label="Cidade/UF" value={[addr.city, addr.uf || addr.state].filter(Boolean).join(" / ")} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="itens">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Categoria</th>
                    <th className="px-3 py-2 text-right">Qtd</th>
                    <th className="px-3 py-2 text-right">Preço</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((it, i) => {
                    const qty = it.qty || 1;
                    const price = typeof it.priceCents === "number" ? it.priceCents : (it.price_cents ?? 0);
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2">{it.name || it.plan_name}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{it.category ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{qty}</td>
                        <td className="px-3 py-2 text-right">{formatBRL(price)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatBRL(price * qty)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="pagamento" className="space-y-1">
            <Field label="Método" value={METHOD_LABEL[o.payment_method] || o.payment_method} />
            <Field label="Parcelas" value={o.installments} />
            <Field label="Bandeira" value={o.card_brand} />
            <Field label="Final" value={o.card_last4 ? `•••• ${o.card_last4}` : null} />
            <Field label="PaymentId" value={o.cielo_payment_id} mono />
            <Field label="NSU" value={o.cielo_proof_of_sale} mono />
            <Field label="AuthCode" value={o.cielo_auth_code} mono />
            {o.pix_qr_string && (
              <div className="mt-3 rounded-lg border border-border p-3 space-y-2">
                <div className="text-xs uppercase text-muted-foreground">Pix</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all text-[11px] font-mono bg-muted/40 rounded p-2">{o.pix_qr_string}</code>
                  <CopyBtn value={o.pix_qr_string} label="Código Pix copiado" />
                </div>
                {o.pix_expires_at && <Field label="Expira" value={new Date(o.pix_expires_at).toLocaleString("pt-BR")} />}
              </div>
            )}
            {o.boleto_url && (
              <div className="mt-3 rounded-lg border border-border p-3 space-y-2">
                <div className="text-xs uppercase text-muted-foreground">Boleto</div>
                <Button size="sm" variant="outline" asChild>
                  <a href={o.boleto_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir boleto</a>
                </Button>
                {o.boleto_digitable_line && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all text-[11px] font-mono bg-muted/40 rounded p-2">{o.boleto_digitable_line}</code>
                    <CopyBtn value={o.boleto_digitable_line} label="Linha digitável copiada" />
                  </div>
                )}
                {o.boleto_due_date && <Field label="Vencimento" value={o.boleto_due_date} />}
              </div>
            )}
            {o.last_error && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="text-xs uppercase text-destructive mb-1">Último erro</div>
                <pre className="text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(o.last_error, null, 2)}</pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="linha" className="space-y-1">
            <Field label="Provider" value={o.provider} />
            <Field label="SIM" value={o.sim_kind} />
            <Field label="MSISDN" value={o.msisdn} mono />
            <Field label="ICCID" value={o.iccid} mono />
            <Field label="Rastreio" value={o.tracking_code} mono />
            <Field label="eSIM QR URL" value={o.esim_qr_url} mono />
            <Field label="eSIM código" value={o.esim_activation_code} mono />
            <Field label="Algar subscriber" value={o.algar_subscriber_id} mono />
            <Field label="Algar service" value={o.algar_service_id} mono />
            <Field label="Algar mobile line" value={o.algar_mobileline_id} mono />
            <Field label="Provider PaymentId" value={o.provider_payment_id} mono />
            <Field label="Provisionamento status" value={o.provisioning_status ? (PROV_LABEL[o.provisioning_status] || o.provisioning_status) : null} />
            <Field label="Tentativas" value={o.provisioning_attempts} />
            {o.provisioning_last_error && (
              <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="text-xs uppercase text-destructive mb-1">Último erro provisionamento</div>
                <div className="text-xs whitespace-pre-wrap">{o.provisioning_last_error}</div>
              </div>
            )}
            {port && Object.keys(port).length > 0 && (
              <div className="mt-3 rounded-lg border border-border p-3">
                <div className="text-xs uppercase text-muted-foreground mb-2">Portabilidade</div>
                <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(port, null, 2)}</pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <VendaTimeline orderId={o.id} />
          </TabsContent>

          <TabsContent value="json">
            <pre className="text-[11px] whitespace-pre-wrap break-all bg-muted/40 rounded p-3 max-h-[60vh] overflow-auto">
              {JSON.stringify(o, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
