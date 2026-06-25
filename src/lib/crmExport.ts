import type { CrmLead } from "@/components/admin/crm/types";
import { STAGES } from "@/components/admin/crm/types";

function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function leadsToCsv(leads: CrmLead[]): string {
  const headers = [
    "Criado em",
    "Nome",
    "Telefone",
    "E-mail",
    "Cidade",
    "UF",
    "CEP",
    "Origem",
    "Estágio",
    "Itens",
    "Total (R$)",
    "Cupom",
    "Notas",
  ];

  const rows = leads.map((l) => {
    const stageLabel = STAGES.find((s) => s.id === l.stage)?.label || l.stage;
    const items = l.items
      .map((i) => `${i.qty || 1}x ${i.plan_name}`)
      .join(" | ");
    return [
      new Date(l.created_at).toLocaleString("pt-BR"),
      l.customer_name,
      l.customer_phone || "",
      l.customer_email || "",
      l.city || "",
      l.uf || "",
      l.cep || "",
      l.source,
      stageLabel,
      items,
      (l.total_cents / 100).toFixed(2).replace(".", ","),
      l.coupon_code || "",
      l.notes || "",
    ].map(csvEscape).join(";");
  });

  return [headers.join(";"), ...rows].join("\n");
}

export function downloadLeadsCsv(leads: CrmLead[]) {
  const csv = "\uFEFF" + leadsToCsv(leads); // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `crm-leads-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
