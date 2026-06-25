// Gerador de PDF de proposta comercial — pdf-lib
// Layout A4 retrato, header azul (primary), destaque em laranja (accent).
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import logoUrl from "@/assets/jotazo-logo-proposta.png";

// Brand colors (HSL do tema convertidos para RGB aproximado)
const BLUE = rgb(0.043, 0.255, 0.553);      // #0B4189 (primary)
const BLUE_DARK = rgb(0.027, 0.176, 0.396); // #072D65
const ORANGE = rgb(0.957, 0.498, 0.106);    // #F47F1B (accent)
const TEXT = rgb(0.13, 0.13, 0.15);
const MUTED = rgb(0.45, 0.45, 0.5);
const BORDER = rgb(0.87, 0.87, 0.9);
const ZEBRA = rgb(0.97, 0.97, 0.98);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 595.28;   // A4
const PAGE_H = 841.89;
const MARGIN_X = 40;
const HEADER_H = 90;
const FOOTER_H = 50;

export type PropostaItem = {
  name: string;
  description?: string;
  priceCents: number;
  includes?: string[];
};

export type PropostaPdfData = {
  number: number;
  date: Date;
  customer: {
    name: string;
    doc?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: PropostaItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  conditions: {
    fidelityLabel: string;
    installationLabel: string;
    paymentLabel: string;
    validUntilLabel?: string;
  };
  notes?: string;
  seller: {
    name: string;
    phone?: string;
    email?: string;
  };
  whatsappLink?: string;
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

async function drawHeader(page: PDFPage, pdf: PDFDocument, font: PDFFont, fontBold: PDFFont, data: PropostaPdfData) {
  // Banda azul
  page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: BLUE });
  page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H - 4, width: PAGE_W, height: 4, color: ORANGE });

  // Logo
  try {
    const logoBytes = await fetchBytes(logoUrl);
    const img = await pdf.embedPng(logoBytes);
    const ratio = img.width / img.height;
    const h = 72;
    const w = h * ratio;
    page.drawImage(img, { x: MARGIN_X, y: PAGE_H - HEADER_H + (HEADER_H - h) / 2, width: w, height: h });
  } catch { /* fallback: nome em texto */
    page.drawText("JOTAZO TELECOM", {
      x: MARGIN_X, y: PAGE_H - HEADER_H / 2 - 6, size: 18, font: fontBold, color: WHITE,
    });
  }

  // Bloco direito
  const rightX = PAGE_W - MARGIN_X;
  const numLabel = `Proposta Nº ${String(data.number).padStart(4, "0")}`;
  const dateLabel = data.date.toLocaleDateString("pt-BR");
  const numW = fontBold.widthOfTextAtSize(numLabel, 12);
  const dtW = font.widthOfTextAtSize(dateLabel, 10);
  page.drawText(numLabel, { x: rightX - numW, y: PAGE_H - 38, size: 12, font: fontBold, color: WHITE });
  page.drawText(dateLabel, { x: rightX - dtW, y: PAGE_H - 56, size: 10, font, color: rgb(0.85, 0.9, 1) });
}

function drawFooter(page: PDFPage, font: PDFFont, fontBold: PDFFont, pageNum: number, totalPages: number) {
  page.drawLine({
    start: { x: MARGIN_X, y: FOOTER_H + 10 },
    end: { x: PAGE_W - MARGIN_X, y: FOOTER_H + 10 },
    thickness: 0.5, color: BORDER,
  });
  const line1 = "Jotazo Telecom  •  jotazo.com.br  •  0800 721 0179";
  const w1 = font.widthOfTextAtSize(line1, 9);
  page.drawText(line1, { x: (PAGE_W - w1) / 2, y: 28, size: 9, font, color: MUTED });
  const pg = `Página ${pageNum} de ${totalPages}`;
  const wpg = font.widthOfTextAtSize(pg, 8);
  page.drawText(pg, { x: PAGE_W - MARGIN_X - wpg, y: 14, size: 8, font, color: MUTED });
}

export async function buildPropostaPdf(data: PropostaPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  const pages: PDFPage[] = [page];
  await drawHeader(page, pdf, font, fontBold, data);

  let y = PAGE_H - HEADER_H - 30;
  const contentW = PAGE_W - MARGIN_X * 2;

  const ensureSpace = async (needed: number) => {
    if (y - needed < FOOTER_H + 20) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      pages.push(page);
      await drawHeader(page, pdf, font, fontBold, data);
      y = PAGE_H - HEADER_H - 30;
    }
  };

  // Título
  page.drawText("PROPOSTA COMERCIAL", { x: MARGIN_X, y, size: 18, font: fontBold, color: BLUE_DARK });
  y -= 6;
  page.drawRectangle({ x: MARGIN_X, y: y - 4, width: 48, height: 3, color: ORANGE });
  y -= 24;

  // Cliente
  const sectionTitle = (txt: string) => {
    page.drawText(txt, { x: MARGIN_X, y, size: 11, font: fontBold, color: BLUE });
    y -= 4;
    page.drawLine({
      start: { x: MARGIN_X, y: y - 2 }, end: { x: PAGE_W - MARGIN_X, y: y - 2 },
      thickness: 0.5, color: BORDER,
    });
    y -= 14;
  };

  const field = (label: string, value: string) => {
    if (!value) return;
    page.drawText(label, { x: MARGIN_X, y, size: 9, font, color: MUTED });
    const lblW = font.widthOfTextAtSize(label, 9);
    const lines = wrapText(value, font, 10, contentW - lblW - 8);
    let lx = MARGIN_X + lblW + 6;
    let ly = y;
    for (const line of lines) {
      page.drawText(line, { x: lx, y: ly, size: 10, font: fontBold, color: TEXT });
      lx = MARGIN_X; ly -= 12;
    }
    y = ly - 4;
  };

  sectionTitle("DADOS DO CLIENTE");
  field("Nome:", data.customer.name);
  if (data.customer.doc) field("CPF/CNPJ:", data.customer.doc);
  if (data.customer.email) field("E-mail:", data.customer.email);
  if (data.customer.phone) field("Telefone:", data.customer.phone);
  if (data.customer.address) field("Endereço:", data.customer.address);
  y -= 10;

  // Planos
  await ensureSpace(60);
  sectionTitle("PLANOS SELECIONADOS");

  let zebra = false;
  for (const it of data.items) {
    // estimar altura
    const descLines = it.description ? wrapText(it.description, font, 9, contentW - 130) : [];
    const incl = it.includes || [];
    const rowH = 28 + descLines.length * 11 + incl.length * 12 + 8;

    await ensureSpace(rowH);

    if (zebra) {
      page.drawRectangle({ x: MARGIN_X, y: y - rowH + 6, width: contentW, height: rowH, color: ZEBRA });
    }
    zebra = !zebra;

    // Nome + preço
    page.drawText(it.name, { x: MARGIN_X + 10, y: y - 6, size: 12, font: fontBold, color: TEXT });
    const priceTxt = `${brl(it.priceCents)}/mês`;
    const pw = fontBold.widthOfTextAtSize(priceTxt, 12);
    page.drawText(priceTxt, { x: PAGE_W - MARGIN_X - 10 - pw, y: y - 6, size: 12, font: fontBold, color: BLUE });
    y -= 20;

    for (const dl of descLines) {
      page.drawText(dl, { x: MARGIN_X + 10, y, size: 9, font, color: MUTED });
      y -= 11;
    }
    for (const inc of incl) {
      page.drawText("•", { x: MARGIN_X + 14, y, size: 10, font: fontBold, color: ORANGE });
      const ilines = wrapText(inc, font, 9, contentW - 30);
      for (let i = 0; i < ilines.length; i++) {
        page.drawText(ilines[i], { x: MARGIN_X + 22, y, size: 9, font, color: TEXT });
        y -= 12;
      }
    }
    y -= 6;
  }
  y -= 6;

  // Totais
  await ensureSpace(90);
  const totalsX = PAGE_W - MARGIN_X - 230;
  page.drawLine({ start: { x: totalsX, y }, end: { x: PAGE_W - MARGIN_X, y }, thickness: 0.5, color: BORDER });
  y -= 14;
  const drawTotalLine = (label: string, value: string, bold = false, color = TEXT) => {
    const lblFont = bold ? fontBold : font;
    page.drawText(label, { x: totalsX, y, size: 10, font: lblFont, color });
    const vw = lblFont.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: PAGE_W - MARGIN_X - vw, y, size: 10, font: lblFont, color });
    y -= 14;
  };
  drawTotalLine("Subtotal:", brl(data.subtotalCents));
  if (data.discountCents > 0) drawTotalLine("Desconto:", `- ${brl(data.discountCents)}`, false, ORANGE);

  y -= 4;
  page.drawRectangle({ x: totalsX, y: y - 10, width: PAGE_W - MARGIN_X - totalsX, height: 28, color: ORANGE });
  page.drawText("TOTAL MENSAL", { x: totalsX + 8, y: y + 2, size: 11, font: fontBold, color: WHITE });
  const totTxt = brl(data.totalCents);
  const tw = fontBold.widthOfTextAtSize(totTxt, 14);
  page.drawText(totTxt, { x: PAGE_W - MARGIN_X - 8 - tw, y: y, size: 14, font: fontBold, color: WHITE });
  y -= 30;

  // Condições
  await ensureSpace(110);
  sectionTitle("CONDIÇÕES COMERCIAIS");
  field("Fidelidade:", data.conditions.fidelityLabel);
  field("Instalação:", data.conditions.installationLabel);
  field("Pagamento:", data.conditions.paymentLabel);
  if (data.conditions.validUntilLabel) field("Validade da proposta:", data.conditions.validUntilLabel);

  // Observações
  if (data.notes && data.notes.trim()) {
    y -= 6;
    await ensureSpace(40);
    sectionTitle("OBSERVAÇÕES");
    const noteLines = wrapText(data.notes.trim(), font, 10, contentW);
    for (const ln of noteLines) {
      await ensureSpace(14);
      page.drawText(ln, { x: MARGIN_X, y, size: 10, font, color: TEXT });
      y -= 13;
    }
  }

  // Assinatura + vendedor
  await ensureSpace(110);
  y -= 20;
  // linha assinatura
  page.drawLine({
    start: { x: MARGIN_X, y }, end: { x: MARGIN_X + 300, y },
    thickness: 0.7, color: TEXT,
  });
  page.drawText("Assinatura do cliente", { x: MARGIN_X, y: y - 12, size: 9, font, color: MUTED });

  // Box vendedor (direita)
  const vbX = PAGE_W - MARGIN_X - 200;
  const vbY = y - 30;
  page.drawRectangle({ x: vbX, y: vbY, width: 200, height: 60, borderColor: BORDER, borderWidth: 0.5, color: rgb(0.98, 0.98, 1) });
  page.drawText("Seu consultor", { x: vbX + 10, y: vbY + 44, size: 8, font, color: BLUE });
  page.drawText(data.seller.name || "—", { x: vbX + 10, y: vbY + 30, size: 11, font: fontBold, color: TEXT });
  if (data.seller.phone) page.drawText(data.seller.phone, { x: vbX + 10, y: vbY + 16, size: 9, font, color: TEXT });
  if (data.seller.email) page.drawText(data.seller.email, { x: vbX + 10, y: vbY + 4, size: 9, font, color: MUTED });

  // Footers em todas as páginas
  const total = pages.length;
  pages.forEach((p, i) => drawFooter(p, font, fontBold, i + 1, total));

  return await pdf.save();
}
