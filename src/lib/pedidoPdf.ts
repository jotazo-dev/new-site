// Gerador de PDF do pedido (Resumo + Termos) — pdf-lib
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import logoUrl from "@/assets/jotazo-logo-proposta.png";

const BLUE = rgb(0.043, 0.255, 0.553);
const ORANGE = rgb(0.957, 0.498, 0.106);
const TEXT = rgb(0.13, 0.13, 0.15);
const MUTED = rgb(0.45, 0.45, 0.5);
const BORDER = rgb(0.87, 0.87, 0.9);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 40;

export type PedidoPdfData = {
  numero: string;
  date: Date;
  customer: {
    name: string;
    document: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  plan: {
    name?: string | null;
    sku?: string | null;
    cycle?: number | null;
  };
  line: {
    provider: "algar" | "eai";
    tn?: string;
    iccid?: string | null;
    simType?: string | null;
    activationCode?: string | null;
  };
  rbx: {
    clienteCodigo?: string;
    contratoCodigo?: string;
    osCodigo?: string;
  };
  termsText?: string;
};

const DEFAULT_TERMS = `TERMO DE ADESÃO E CONDIÇÕES GERAIS DE PRESTAÇÃO DE SERVIÇOS

1. OBJETO. O presente termo regula a contratação dos serviços de telecomunicações (linha móvel e/ou dados) prestados pela Jotazo Telecom ao CLIENTE identificado neste pedido, sob as condições do plano selecionado.

2. ATIVAÇÃO E ENTREGA. A linha será ativada após validação cadastral e disponibilização do SIM/eSIM. O CLIENTE declara que as informações fornecidas são verdadeiras e atualizadas.

3. PAGAMENTOS. O CLIENTE pagará mensalmente o valor do plano contratado, conforme ciclo de faturamento informado. O atraso superior a 30 dias autoriza a suspensão dos serviços.

4. USO ADEQUADO. É vedado o uso da linha para fins ilícitos, fraude, revenda não autorizada ou que viole políticas de uso razoável definidas pela operadora parceira.

5. CANCELAMENTO E PORTABILIDADE. O CLIENTE pode solicitar o cancelamento a qualquer momento. Em caso de portabilidade para outra operadora, deverá quitar débitos pendentes.

6. PROTEÇÃO DE DADOS. Os dados pessoais do CLIENTE são tratados conforme a LGPD e exclusivamente para a prestação dos serviços contratados.

7. ATENDIMENTO. Canais oficiais: WhatsApp e portal Minha Conta em jotazo.com.br.

8. FORO. Fica eleito o foro da comarca de Manhuaçu/MG para dirimir quaisquer dúvidas oriundas deste contrato.`;

function brDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(test, size) <= maxW) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    return new Uint8Array(await res.arrayBuffer());
  } catch { return null; }
}

async function drawHeader(page: PDFPage, pdf: PDFDocument, font: PDFFont, fontBold: PDFFont, data: PedidoPdfData) {
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: BLUE });
  // Logo
  const logoBytes = await fetchBytes(logoUrl);
  if (logoBytes) {
    try {
      const img = await pdf.embedPng(logoBytes);
      const scale = 36 / img.height;
      page.drawImage(img, { x: MARGIN_X, y: PAGE_H - 60, width: img.width * scale, height: 36 });
    } catch { /* ignore */ }
  }
  page.drawText("PEDIDO DE ATIVAÇÃO", {
    x: PAGE_W - MARGIN_X - fontBold.widthOfTextAtSize("PEDIDO DE ATIVAÇÃO", 14),
    y: PAGE_H - 40, size: 14, font: fontBold, color: WHITE,
  });
  page.drawText(`Nº ${data.numero} · ${brDate(data.date)}`, {
    x: PAGE_W - MARGIN_X - font.widthOfTextAtSize(`Nº ${data.numero} · ${brDate(data.date)}`, 10),
    y: PAGE_H - 58, size: 10, font, color: WHITE,
  });
}

function section(page: PDFPage, fontBold: PDFFont, title: string, y: number): number {
  page.drawRectangle({ x: MARGIN_X, y: y - 4, width: 3, height: 14, color: ORANGE });
  page.drawText(title, { x: MARGIN_X + 10, y: y, size: 11, font: fontBold, color: BLUE });
  return y - 18;
}

function field(page: PDFPage, font: PDFFont, fontBold: PDFFont, label: string, value: string, x: number, y: number, w: number): number {
  page.drawText(label, { x, y, size: 8, font, color: MUTED });
  const lines = wrap(value || "—", font, 10, w);
  let cy = y - 12;
  for (const ln of lines) {
    page.drawText(ln, { x, y: cy, size: 10, font: fontBold, color: TEXT });
    cy -= 12;
  }
  return cy - 2;
}

function row(page: PDFPage, font: PDFFont, fontBold: PDFFont, label: string, value: string, y: number): number {
  page.drawText(label, { x: MARGIN_X, y, size: 9, font, color: MUTED });
  const lines = wrap(value || "—", fontBold, 10, PAGE_W - 2 * MARGIN_X - 130);
  let cy = y;
  for (const ln of lines) {
    page.drawText(ln, { x: MARGIN_X + 130, y: cy, size: 10, font: fontBold, color: TEXT });
    cy -= 13;
  }
  return cy - 2;
}

export async function generatePedidoPdf(data: PedidoPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // ====== Página 1 — Resumo ======
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  await drawHeader(page, pdf, font, fontBold, data);

  let y = PAGE_H - 110;

  y = section(page, fontBold, "CLIENTE", y);
  y = row(page, font, fontBold, "Nome / Razão social", data.customer.name, y);
  y = row(page, font, fontBold, "Documento", data.customer.document, y);
  if (data.customer.email) y = row(page, font, fontBold, "E-mail", data.customer.email, y);
  if (data.customer.phone) y = row(page, font, fontBold, "Telefone", data.customer.phone, y);
  if (data.customer.address) y = row(page, font, fontBold, "Endereço", data.customer.address, y);

  y -= 10;
  y = section(page, fontBold, "PLANO CONTRATADO", y);
  y = row(page, font, fontBold, "Plano", data.plan.name || data.plan.sku || "—", y);
  if (data.plan.sku) y = row(page, font, fontBold, "SKU/ID", data.plan.sku, y);
  if (data.plan.cycle) y = row(page, font, fontBold, "Ciclo (dia)", String(data.plan.cycle), y);

  y -= 10;
  y = section(page, fontBold, "LINHA MÓVEL ATIVADA", y);
  y = row(page, font, fontBold, "Operadora", data.line.provider === "algar" ? "Algar" : "EAI", y);
  if (data.line.tn) y = row(page, font, fontBold, "Número", data.line.tn, y);
  if (data.line.iccid) y = row(page, font, fontBold, "ICCID", data.line.iccid, y);
  if (data.line.simType) y = row(page, font, fontBold, "Tipo", data.line.simType === "esim" ? "eSIM" : "SIM físico", y);
  if (data.line.activationCode) y = row(page, font, fontBold, "Cód. ativação", data.line.activationCode, y);

  y -= 10;
  y = section(page, fontBold, "REGISTRO INTERNO (RBX)", y);
  if (data.rbx.clienteCodigo) y = row(page, font, fontBold, "Cliente RBX", data.rbx.clienteCodigo, y);
  if (data.rbx.contratoCodigo) y = row(page, font, fontBold, "Contrato RBX", data.rbx.contratoCodigo, y);
  if (data.rbx.osCodigo) y = row(page, font, fontBold, "OS RBX", data.rbx.osCodigo, y);
  if (!data.rbx.clienteCodigo && !data.rbx.contratoCodigo && !data.rbx.osCodigo) {
    y = row(page, font, fontBold, "Status", "Sem registros RBX vinculados", y);
  }

  // Footer page 1
  page.drawLine({ start: { x: MARGIN_X, y: 60 }, end: { x: PAGE_W - MARGIN_X, y: 60 }, thickness: 0.5, color: BORDER });
  page.drawText("Jotazo Telecom · jotazo.com.br · Pedido gerado automaticamente", {
    x: MARGIN_X, y: 46, size: 8, font, color: MUTED,
  });
  page.drawText("Página 1 de 2", {
    x: PAGE_W - MARGIN_X - font.widthOfTextAtSize("Página 1 de 2", 8),
    y: 46, size: 8, font, color: MUTED,
  });

  // ====== Página 2 — Termos ======
  const p2 = pdf.addPage([PAGE_W, PAGE_H]);
  await drawHeader(p2, pdf, font, fontBold, data);
  let ty = PAGE_H - 110;
  ty = section(p2, fontBold, "TERMO DE ADESÃO", ty);

  const termsText = data.termsText || DEFAULT_TERMS;
  const paragraphs = termsText.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const lines = wrap(para.trim(), font, 9.5, PAGE_W - 2 * MARGIN_X);
    for (const ln of lines) {
      if (ty < 80) break;
      p2.drawText(ln, { x: MARGIN_X, y: ty, size: 9.5, font, color: TEXT });
      ty -= 13;
    }
    ty -= 6;
  }

  p2.drawLine({ start: { x: MARGIN_X, y: 60 }, end: { x: PAGE_W - MARGIN_X, y: 60 }, thickness: 0.5, color: BORDER });
  p2.drawText("Jotazo Telecom · Termo de adesão · CNPJ conforme cadastro", {
    x: MARGIN_X, y: 46, size: 8, font, color: MUTED,
  });
  p2.drawText("Página 2 de 2", {
    x: PAGE_W - MARGIN_X - font.widthOfTextAtSize("Página 2 de 2", 8),
    y: 46, size: 8, font, color: MUTED,
  });

  return await pdf.save();
}

export async function downloadPedidoPdf(data: PedidoPdfData) {
  const bytes = await generatePedidoPdf(data);
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedido-${data.numero}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
