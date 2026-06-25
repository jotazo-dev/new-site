// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import QRCode from "npm:qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM_DEFAULT = "Jotazo Telecom <onboarding@resend.dev>";

function getEmailFrom(): string {
  return Deno.env.get("MVNO_EMAIL_FROM") || FROM_DEFAULT;
}

function isUnverifiedSenderDomainError(detail: any): boolean {
  const message = String(detail?.message || detail?.error || "").toLowerCase();
  return detail?.name === "validation_error" && message.includes("domain is not verified");
}

async function sendWithResend(apiKey: string, payload: Record<string, any>) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, body };
}

interface ActivationPayload {
  mode?: "send" | "pdf" | "preview" | "preview_pdf" | "test";
  activationId?: string;
  recipientEmail?: string; // for "test" / override
  provider: "algar" | "eai";
  tn?: string;
  iccid?: string;
  simType: "sim" | "esim";
  productName?: string;
  productSku?: string;
  cycle?: number;
  locale?: string;
  subscriberName?: string;
  subscriberDoc?: string;
  subscriberEmail?: string;
  subscriberPhone?: string;
  notes?: string;
  activationCode?: string;
  qrPayload?: string;
}

async function qrPng(payload: string): Promise<Uint8Array> {
  const dataUrl = await QRCode.toDataURL(payload, { width: 320, margin: 1 });
  return Uint8Array.from(atob(dataUrl.split(",")[1]), c => c.charCodeAt(0));
}
async function qrDataUrl(payload: string): Promise<string> {
  return await QRCode.toDataURL(payload, { width: 320, margin: 1 });
}

interface Template {
  slug: string;
  subject: string;
  header_title: string;
  intro_html: string;
  footer_html: string;
  signature_html: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  pdf_header_text: string;
  pdf_footer_text: string;
}

const DEFAULT_TEMPLATE: Template = {
  slug: "default",
  subject: "Sua linha Jotazo — {{tn}}",
  header_title: "JOTAZO TELECOM",
  intro_html: "<p>Olá <strong>{{primeiro_nome}}</strong>,</p><p>Confirmamos a contratação da sua linha móvel Jotazo.</p>",
  footer_html: "Os detalhes completos da sua linha estão no PDF anexo.",
  signature_html: "Equipe Jotazo Telecom",
  primary_color: "#0B4189",
  accent_color: "#F47F1B",
  logo_url: null,
  pdf_header_text: "Comprovante de contratação de linha móvel",
  pdf_footer_text: "Jotazo Telecom · esim@jotazo.com · jotazo.com.br",
};

function formatTn(tn?: string) {
  if (!tn) return "—";
  const d = tn.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 13 && d.startsWith("55"))
    return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  return tn;
}

function formatDoc(doc?: string) {
  if (!doc) return "—";
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  return doc;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const num = parseInt(n || "0B4189", 16);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

function vars(p: ActivationPayload): Record<string, string> {
  return {
    nome: p.subscriberName || "cliente",
    primeiro_nome: (p.subscriberName || "cliente").split(" ")[0],
    tn: formatTn(p.tn),
    iccid: p.iccid || "—",
    produto: p.productName || p.productSku || "—",
    ciclo: p.cycle ? `Dia ${p.cycle}` : "—",
    codigo_ativacao: p.activationCode || "",
    qr_code: p.qrPayload || p.activationCode || "",
    email: p.subscriberEmail || "",
    telefone: p.subscriberPhone || "",
    documento: formatDoc(p.subscriberDoc),
    operadora: p.provider === "algar" ? "Jotazo Brasil (Algar)" : "Jotazo Brasil (EAI)",
    tipo_chip: p.simType === "esim" ? "eSIM (digital)" : "SIM Card (físico)",
  };
}

function interpolate(text: string, v: Record<string, string>): string {
  return (text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => v[k] ?? "");
}

async function generatePdf(p: ActivationPayload, t: Template): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const BRAND = hexToRgb(t.primary_color);
  const ACCENT = hexToRgb(t.accent_color);
  const TEXT_DARK = rgb(0.13, 0.16, 0.22);
  const TEXT_MUTED = rgb(0.42, 0.45, 0.52);
  const v = vars(p);

  // Try to embed configured logo
  let logoImg: any = null;
  if (t.logo_url) {
    try {
      const res = await fetch(t.logo_url);
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        logoImg = ct.includes("jpeg") || ct.includes("jpg")
          ? await pdf.embedJpg(bytes)
          : await pdf.embedPng(bytes);
      }
    } catch (_) { /* segue sem logo */ }
  }

  const drawHeader = (pg: any, title: string) => {
    const { width: pw, height: ph } = pg.getSize();
    pg.drawRectangle({ x: 0, y: ph - 90, width: pw, height: 90, color: BRAND });
    if (logoImg) {
      const maxH = 56;
      const scale = maxH / logoImg.height;
      const w = logoImg.width * scale;
      pg.drawImage(logoImg, { x: 40, y: ph - 75, width: w, height: maxH });
      pg.drawText(title, { x: 40 + w + 16, y: ph - 50, size: 16, font: bold, color: rgb(1, 1, 1) });
    } else {
      pg.drawText(t.header_title || "JOTAZO TELECOM", { x: 40, y: ph - 45, size: 22, font: bold, color: rgb(1, 1, 1) });
      pg.drawText(title, { x: 40, y: ph - 68, size: 11, font, color: rgb(0.9, 0.92, 1) });
    }
    pg.drawRectangle({ x: 0, y: ph - 96, width: pw, height: 6, color: ACCENT });
  };

  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();
  drawHeader(page, interpolate(t.pdf_header_text, v));

  let y = height - 130;
  const drawSectionTitle = (text: string) => {
    y -= 6;
    page.drawText(text, { x: 40, y, size: 13, font: bold, color: BRAND });
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.87, 0.92) });
    y -= 14;
  };
  const drawRow = (label: string, value: string) => {
    page.drawText(label, { x: 40, y, size: 10, font: bold, color: TEXT_MUTED });
    page.drawText(value || "—", { x: 200, y, size: 11, font, color: TEXT_DARK, maxWidth: width - 240 });
    y -= 18;
  };

  drawSectionTitle("Dados do titular");
  drawRow("Nome", p.subscriberName || "—");
  drawRow("Documento", formatDoc(p.subscriberDoc));
  drawRow("E-mail", p.subscriberEmail || "—");
  if (p.subscriberPhone) drawRow("Celular", p.subscriberPhone);

  y -= 8;
  drawSectionTitle("Dados da linha");
  drawRow("Operadora", v.operadora);
  drawRow("Número", formatTn(p.tn));
  drawRow("Plano", p.productName || p.productSku || "—");
  if (p.cycle) drawRow("Ciclo", `Dia ${p.cycle}`);
  if (p.locale) drawRow("Localidade", p.locale);
  drawRow("Tipo de chip", v.tipo_chip);
  if (p.iccid) drawRow("ICCID", p.iccid);

  // Observações são campo interno — nunca incluir no PDF enviado ao cliente.

  if (p.simType === "esim" && (p.activationCode || p.qrPayload)) {
    const qrPage = pdf.addPage([595, 842]);
    const w = qrPage.getWidth();
    const h = qrPage.getHeight();
    drawHeader(qrPage, "Ativação do seu eSIM");

    const payload = p.qrPayload || p.activationCode || "";
    try {
      const dataUrl = await QRCode.toDataURL(payload, { width: 600, margin: 1 });
      const pngBytes = Uint8Array.from(atob(dataUrl.split(",")[1]), c => c.charCodeAt(0));
      const png = await pdf.embedPng(pngBytes);
      const size = 280;
      qrPage.drawImage(png, { x: (w - size) / 2, y: h - 420, width: size, height: size });
    } catch (_) {}

    let yy = h - 460;
    qrPage.drawText("Código de ativação (LPA):", { x: 40, y: yy, size: 11, font: bold, color: BRAND });
    yy -= 16;
    qrPage.drawText(p.activationCode || payload, { x: 40, y: yy, size: 8, font, color: TEXT_DARK, maxWidth: w - 80 });

    yy -= 36;
    qrPage.drawText("Como instalar:", { x: 40, y: yy, size: 13, font: bold, color: BRAND });
    yy -= 20;
    const steps = [
      "1. Abra Ajustes > Celular (iPhone) ou Ajustes > Conexões > Gerenciador de SIM (Android).",
      "2. Toque em \"Adicionar eSIM\" e escolha \"Usar QR Code\".",
      "3. Aponte a câmera para o QR Code ao lado ou cole o código LPA manualmente.",
      "4. Aguarde a ativação e nomeie sua linha como \"Jotazo\".",
      "5. Defina a Jotazo como linha padrão de dados, se desejar.",
    ];
    for (const s of steps) {
      qrPage.drawText(s, { x: 40, y: yy, size: 10, font, color: TEXT_DARK, maxWidth: w - 80 });
      yy -= 16;
    }
  }

  const pages = pdf.getPages();
  const footerText = interpolate(t.pdf_footer_text, v);
  for (const pg of pages) {
    pg.drawText(footerText, { x: 40, y: 30, size: 9, font, color: TEXT_MUTED });
  }

  return await pdf.save();
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function buildHtml(p: ActivationPayload, t: Template, qrImgSrc?: string): string {
  const v = vars(p);
  const isEsim = p.simType === "esim";
  const logo = t.logo_url
    ? `<img src="${t.logo_url}" alt="${t.header_title}" style="max-height:80px;display:block"/>`
    : `<div style="font-size:22px;font-weight:bold;letter-spacing:.5px">${t.header_title}</div>`;
  const qrBlock = isEsim && qrImgSrc ? `
      <div style="margin-top:24px;padding:20px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;text-align:center">
        <div style="font-size:14px;font-weight:bold;color:${t.primary_color};margin-bottom:10px">Escaneie o QR Code para ativar seu eSIM</div>
        <img src="${qrImgSrc}" alt="QR Code eSIM" width="220" height="220" style="display:block;margin:0 auto;border:8px solid #ffffff;border-radius:8px"/>
        <div style="font-size:12px;color:#6b7180;margin-top:10px;line-height:1.5">
          Abra <strong>Ajustes &gt; Celular &gt; Adicionar eSIM</strong> (iPhone)<br/>
          ou <strong>Ajustes &gt; Conexões &gt; Gerenciador de SIM</strong> (Android)<br/>
          e aponte a câmera para o QR Code.
        </div>
        <div style="font-size:11px;color:#8a8f9c;margin-top:8px">Se preferir, o código de ativação também está no PDF anexo.</div>
      </div>` : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#21263a">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">
    <div style="background:${t.primary_color};padding:28px 32px;color:#fff">
      ${logo}
      <div style="opacity:.85;margin-top:6px;font-size:13px">Sua nova linha móvel está pronta</div>
    </div>
    <div style="height:5px;background:${t.accent_color}"></div>
    <div style="padding:28px 32px">
      <div style="font-size:14px;line-height:1.55">${interpolate(t.intro_html, v)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
        <tr><td style="padding:8px 0;color:#6b7180;width:140px">Número</td><td style="padding:8px 0;font-weight:bold">${v.tn}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7180">Plano</td><td style="padding:8px 0">${v.produto}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7180">Tipo de chip</td><td style="padding:8px 0">${v.tipo_chip}</td></tr>
        ${p.iccid ? `<tr><td style="padding:8px 0;color:#6b7180">ICCID</td><td style="padding:8px 0;font-family:monospace;font-size:12px">${p.iccid}</td></tr>` : ""}
        ${p.cycle ? `<tr><td style="padding:8px 0;color:#6b7180">Ciclo</td><td style="padding:8px 0">Dia ${p.cycle}</td></tr>` : ""}
      </table>
      ${qrBlock}
      <div style="margin-top:22px;padding:14px 16px;background:#fff5ec;border-left:4px solid ${t.accent_color};border-radius:6px;font-size:13px;line-height:1.5">
        ${interpolate(t.footer_html, v) || (isEsim ? "Abra o PDF anexo para visualizar o QR Code." : "Os detalhes completos estão no PDF anexo.")}
      </div>
      <p style="margin:28px 0 0 0;font-size:13px;color:#6b7180">${interpolate(t.signature_html, v)}</p>
    </div>
    <div style="background:#f4f6fb;padding:18px 32px;text-align:center;font-size:12px;color:#8a8f9c">
      © Jotazo Telecom · jotazo.com.br
    </div>
  </div>
</body></html>`;
}

async function loadActivation(admin: any, id: string): Promise<ActivationPayload | null> {
  const { data } = await admin.from("mvno_activations").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    activationId: data.id,
    provider: data.provider,
    tn: data.tn,
    iccid: data.iccid,
    simType: data.sim_type,
    productName: data.product_name,
    productSku: data.product_sku,
    cycle: data.cycle,
    locale: data.locale,
    subscriberName: data.subscriber_name,
    subscriberDoc: data.subscriber_doc,
    subscriberEmail: data.subscriber_email,
    subscriberPhone: data.subscriber_phone,
    notes: data.notes,
    activationCode: data.activation_code,
    qrPayload: data.qr_payload,
  };
}

async function loadTemplate(admin: any, simType: "sim" | "esim"): Promise<Template> {
  const slug = simType === "esim" ? "activation_esim" : "activation_sim";
  const { data } = await admin.from("mvno_email_templates").select("*").eq("slug", slug).maybeSingle();
  return (data as Template) || DEFAULT_TEMPLATE;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    let body = (await req.json()) as ActivationPayload;
    const mode = body.mode || "send";

    // If activationId provided, hydrate from DB
    if (body.activationId) {
      const loaded = await loadActivation(admin, body.activationId);
      if (loaded) body = { ...loaded, ...body, mode };
    }

    const template = await loadTemplate(admin, body.simType);

    const isEsim = body.simType === "esim";
    const qrPayload = body.qrPayload || body.activationCode || "";

    if (mode === "preview") {
      const dataUrl = isEsim && qrPayload ? await qrDataUrl(qrPayload) : undefined;
      const html = buildHtml(body, template, dataUrl);
      return new Response(JSON.stringify({ html, subject: interpolate(template.subject, vars(body)) }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBytes = await generatePdf(body, template);
    const pdfB64 = uint8ToBase64(pdfBytes);
    const filename = `linha-jotazo-${(body.tn || "ativacao").replace(/\D/g, "") || "linha"}.pdf`;

    if (mode === "pdf" || mode === "preview_pdf") {
      return new Response(JSON.stringify({ ok: true, pdfBase64: pdfB64, filename }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // send or test
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const to = body.recipientEmail || body.subscriberEmail;
    if (!to) {
      return new Response(JSON.stringify({ error: "recipient email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = interpolate(template.subject, vars(body));

    const attachments: any[] = [{ filename, content: pdfB64 }];
    let qrCidSrc: string | undefined;
    if (isEsim && qrPayload) {
      const qrBytes = await qrPng(qrPayload);
      attachments.push({
        filename: "qrcode.png",
        content: uint8ToBase64(qrBytes),
        content_id: "qrcode-esim",
        disposition: "inline",
        content_type: "image/png",
      });
      qrCidSrc = "cid:qrcode-esim";
    }

    const emailPayload = {
      from: getEmailFrom(),
      to: [to],
      subject,
      html: buildHtml(body, template, qrCidSrc),
      attachments,
    };
    let result = await sendWithResend(RESEND_API_KEY, emailPayload);

    const senderDomainNotVerified = !result.ok && isUnverifiedSenderDomainError(result.body);
    if (!result.ok && emailPayload.from !== FROM_DEFAULT && isUnverifiedSenderDomainError(result.body)) {
      console.warn("MVNO email sender domain is not verified", result.body);
    }
    const respBody = result.body;

    if (mode === "send" && body.activationId) {
      if (result.ok) {
        await admin.from("mvno_activations").update({
          email_status: "sent", email_sent_at: new Date().toISOString(), email_error: null,
        }).eq("id", body.activationId);
      } else {
        await admin.from("mvno_activations").update({
          email_status: "failed",
          email_error: JSON.stringify(respBody).slice(0, 500),
        }).eq("id", body.activationId);
      }
    }

    if (senderDomainNotVerified) {
      return new Response(JSON.stringify({
        ok: false,
        error: "sender_domain_not_verified",
        userMessage: "Linha ativada, mas o e-mail não foi enviado porque o domínio do remetente ainda não está verificado.",
        detail: respBody,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!result.ok) {
      return new Response(JSON.stringify({ error: "resend_failed", detail: respBody }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, id: respBody.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-mvno-activation-email error", err);
    return new Response(JSON.stringify({ error: err?.message || "unexpected" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
