import type { VendaRow } from "@/hooks/useVendas";
import { formatBRL } from "@/data/plans";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n;]/.test(s) ? `"${s}"` : s;
}

export function exportVendasCSV(rows: VendaRow[]) {
  const headers = [
    "ID", "Data", "Status", "Método", "Parcelas", "Total", "Nome", "Email", "WhatsApp",
    "CPF/CNPJ", "Itens", "Cielo PaymentId", "Bandeira", "Final", "Provisionamento", "MSISDN",
  ];
  const lines = [headers.join(",")];
  for (const o of rows) {
    const items = Array.isArray(o.items)
      ? (o.items as any[]).map((it) => `${it.name || it.plan_name}×${it.qty || 1}`).join(" | ")
      : "";
    lines.push([
      o.id,
      new Date(o.created_at).toLocaleString("pt-BR"),
      o.status,
      o.payment_method,
      o.installments ?? "",
      formatBRL(o.total_cents),
      o.customer?.name ?? "",
      o.customer_email ?? "",
      o.customer?.phone ?? "",
      o.customer_doc ?? "",
      items,
      o.cielo_payment_id ?? "",
      o.card_brand ?? "",
      o.card_last4 ?? "",
      o.provisioning_status ?? "",
      o.msisdn ?? "",
    ].map(csvEscape).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vendas-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
