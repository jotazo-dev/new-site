import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, Loader2, MoreVertical, RefreshCcw, MessageCircle } from "lucide-react";
import { formatBRL } from "@/data/plans";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { VendaRow } from "@/hooks/useVendas";

export const STATUS_COLOR: Record<string, string> = {
  paid: "bg-green-500/15 text-green-700 border-green-200",
  pending: "bg-amber-500/15 text-amber-700 border-amber-200",
  authorized: "bg-blue-500/15 text-blue-700 border-blue-200",
  failed: "bg-red-500/15 text-red-700 border-red-200",
  canceled: "bg-gray-500/15 text-gray-700 border-gray-200",
  refunded: "bg-purple-500/15 text-purple-700 border-purple-200",
  expired: "bg-gray-500/15 text-gray-700 border-gray-200",
};
export const METHOD_LABEL: Record<string, string> = {
  credit: "Crédito", debit: "Débito", pix: "Pix", boleto: "Boleto",
};
export const PROV_COLOR: Record<string, string> = {
  done: "bg-green-500/15 text-green-700 border-green-200",
  in_progress: "bg-blue-500/15 text-blue-700 border-blue-200",
  queued: "bg-amber-500/15 text-amber-700 border-amber-200",
  failed: "bg-red-500/15 text-red-700 border-red-200",
  not_started: "bg-gray-500/15 text-gray-700 border-gray-200",
};
export const STATUS_LABEL: Record<string, string> = {
  paid: "Pago",
  pending: "Aguardando",
  authorized: "Autorizado",
  failed: "Falhou",
  canceled: "Cancelado",
  refunded: "Estornado",
  expired: "Expirado",
};
export const PROV_LABEL: Record<string, string> = {
  done: "Concluído",
  in_progress: "Em andamento",
  queued: "Na fila",
  failed: "Falhou",
  not_started: "Não iniciado",
};

function wppLink(phone?: string | null) {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  if (!d) return null;
  const full = d.length <= 11 ? "55" + d : d;
  return `https://wa.me/${full}`;
}

type Props = {
  rows: VendaRow[];
  loading: boolean;
  onOpen: (o: VendaRow) => void;
  onRefresh: (o: VendaRow) => Promise<void> | void;
  onReprovision: (o: VendaRow) => Promise<void> | void;
  refreshingId?: string | null;
};

export function VendasTable({ rows, loading, onOpen, onRefresh, onReprovision, refreshingId }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma venda encontrada.</div>;
  }
  return (
    <TooltipProvider delayDuration={150}>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {rows.map((o) => {
          const items: any[] = Array.isArray(o.items) ? o.items : [];
          const wa = wppLink(o.customer?.phone);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onOpen(o)}
              className="w-full text-left p-4 hover:bg-muted/30 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{o.customer?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{o.customer_email ?? "—"}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatBRL(o.total_cents)}</div>
                  <div className="text-[10px] text-muted-foreground">#{o.id.slice(0, 8)}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className={STATUS_COLOR[o.status] || ""} variant="outline">{STATUS_LABEL[o.status] || o.status}</Badge>
                <Badge className={PROV_COLOR[o.provisioning_status || "not_started"] || ""} variant="outline">
                  {PROV_LABEL[o.provisioning_status || "not_started"]}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {METHOD_LABEL[o.payment_method] || o.payment_method}
                  {o.payment_method === "credit" && o.installments && o.installments > 1 ? ` ${o.installments}x` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="truncate">
                  {items[0] ? `${items[0].name || items[0].plan_name} × ${items[0].qty || 1}` : "—"}
                  {items.length > 1 && <span className="ml-1 text-primary">+{items.length - 1}</span>}
                </div>
                <div>{new Date(o.created_at).toLocaleDateString("pt-BR")}</div>
              </div>
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                   className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
                  <MessageCircle className="h-3 w-3" /> {o.customer?.phone}
                </a>
              )}
            </button>
          );
        })}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto max-w-full">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[110px]" />
            <col className="w-[180px]" />
            <col className="w-[200px]" />
            <col className="w-[240px]" />
            <col className="w-[110px]" />
            <col className="w-[120px]" />
            <col className="w-[110px]" />
            <col className="w-[140px]" />
            <col className="w-[120px]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left">Pedido</th>
              <th className="px-3 py-3 text-left">Cliente</th>
              <th className="px-3 py-3 text-left">Contato</th>
              <th className="px-3 py-3 text-left">Itens</th>
              <th className="px-3 py-3 text-right">Valor</th>
              <th className="px-3 py-3 text-left">Pagamento</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Provisionamento</th>
              <th className="px-3 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((o) => {
              const items: any[] = Array.isArray(o.items) ? o.items : [];
              const firstItem = items[0];
              const extra = items.length - 1;
              const wa = wppLink(o.customer?.phone);
              return (
                <tr key={o.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => onOpen(o)}>
                  <td className="px-3 py-3 align-top">
                    <div className="font-mono text-xs">#{o.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="font-medium truncate">{o.customer?.name ?? "—"}</div>
                    {o.customer_doc && <div className="text-xs text-muted-foreground truncate">{o.customer_doc}</div>}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="text-xs truncate">{o.customer_email ?? "—"}</div>
                    {wa ? (
                      <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                         className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline truncate max-w-full">
                        <MessageCircle className="h-3 w-3 shrink-0" />{o.customer?.phone}
                      </a>
                    ) : <div className="text-xs text-muted-foreground">—</div>}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {firstItem ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-xs truncate">
                            <span className="font-medium">{firstItem.name || firstItem.plan_name}</span>
                            <span className="text-muted-foreground"> × {firstItem.qty || 1}</span>
                            {extra > 0 && <span className="ml-1 text-primary">+{extra}</span>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <ul className="space-y-1 text-xs">
                            {items.map((it, i) => (
                              <li key={i}>
                                {it.name || it.plan_name} × {it.qty || 1}
                                {typeof it.priceCents === "number" && ` — ${formatBRL(it.priceCents)}`}
                              </li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3 align-top text-right font-semibold">{formatBRL(o.total_cents)}</td>
                  <td className="px-3 py-3 align-top text-xs">
                    {METHOD_LABEL[o.payment_method] || o.payment_method}
                    {o.payment_method === "credit" && o.installments && o.installments > 1 && ` ${o.installments}x`}
                    {o.card_brand && <div className="text-muted-foreground">{o.card_brand} •••• {o.card_last4}</div>}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge className={STATUS_COLOR[o.status] || ""} variant="outline">{STATUS_LABEL[o.status] || o.status}</Badge>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge className={PROV_COLOR[o.provisioning_status || "not_started"] || ""} variant="outline">
                      {PROV_LABEL[o.provisioning_status || "not_started"] || "—"}
                    </Badge>
                    {o.provisioning_attempts ? (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{o.provisioning_attempts} tentativa{o.provisioning_attempts > 1 ? "s" : ""}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 align-top text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Ver detalhes" onClick={() => onOpen(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {o.cielo_payment_id && (
                        <Button size="icon" variant="ghost" title="Reconsultar Cielo"
                                disabled={refreshingId === o.id}
                                onClick={() => onRefresh(o)}>
                          {refreshingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(o.id)}>
                            Copiar ID do pedido
                          </DropdownMenuItem>
                          {o.cielo_payment_id && (
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(o.cielo_payment_id!)}>
                              Copiar Cielo PaymentId
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onReprovision(o)}>
                            Reenfileirar provisionamento
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/checkoutv2/sucesso/${o.id}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" /> Abrir página de sucesso
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
