// Gera um PDF agregado das linhas Algar ativadas com sucesso.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type BatchPdfLine = {
  tn: string;
  iccid?: string | null;
  simType?: "sim" | "esim" | null;
  activationCode?: string | null;
  emailStatus?: "sent" | "failed" | "skipped";
};

export type BatchPdfInput = {
  customer: { name: string; document: string; email?: string; phone?: string };
  product: { name?: string | null; sku: string; cycle: number; locale?: string };
  lines: BatchPdfLine[];
};

function fmtMsisdn(tn: string): string {
  const d = (tn || "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tn;
}

export function generateAlgarBatchPdf(input: BatchPdfInput): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const MARGIN = 40;
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(11, 65, 141);
  doc.text("Jotazo Telecom — Linhas Ativadas", MARGIN, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, MARGIN, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Cliente", MARGIN, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const c = input.customer;
  doc.text(`Nome: ${c.name}`, MARGIN, y); y += 12;
  doc.text(`Documento: ${c.document}`, MARGIN, y); y += 12;
  if (c.email) { doc.text(`E-mail: ${c.email}`, MARGIN, y); y += 12; }
  if (c.phone) { doc.text(`Telefone: ${c.phone}`, MARGIN, y); y += 12; }
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Plano", MARGIN, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(`${input.product.name || input.product.sku} (${input.product.sku})`, MARGIN, y); y += 12;
  doc.text(`Ciclo: dia ${input.product.cycle}${input.product.locale ? `  ·  Localidade: ${input.product.locale}` : ""}`, MARGIN, y);
  y += 18;

  autoTable(doc, {
    startY: y,
    head: [["#", "Número", "Tipo", "ICCID", "E-mail"]],
    body: input.lines.map((l, i) => [
      String(i + 1),
      fmtMsisdn(l.tn),
      (l.simType || "").toUpperCase(),
      l.iccid || "—",
      l.emailStatus === "sent" ? "Enviado" : l.emailStatus === "failed" ? "Falhou" : "—",
    ]),
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: [11, 65, 141], textColor: 255 },
    margin: { left: MARGIN, right: MARGIN },
  });

  // Página(s) por eSIM com activation code
  const esims = input.lines.filter((l) => l.simType === "esim" && l.activationCode);
  for (const l of esims) {
    doc.addPage();
    let yy = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(11, 65, 141);
    doc.text(`eSIM — ${fmtMsisdn(l.tn)}`, MARGIN, yy); yy += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text("Activation code (LPA):", MARGIN, yy); yy += 16;
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(String(l.activationCode), W - MARGIN * 2);
    doc.text(lines, MARGIN, yy);
  }

  return doc.output("blob");
}
