import nodemailer from "npm:nodemailer@6.9.14";
import { corsHeaders, json, authSession, getSmtpConfig } from "../_shared/webmail.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authSession(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  try {
    const body = await req.json();
    const cfg = await getSmtpConfig(auth.account);
    const transporter = nodemailer.createTransport(cfg);

    const attachments = Array.isArray(body.attachments)
      ? body.attachments.map((a: any) => ({
          filename: a.filename,
          content: a.content_base64 ? Uint8Array.from(atob(a.content_base64), (c) => c.charCodeAt(0)) : undefined,
          contentType: a.contentType,
        }))
      : [];

    const info = await transporter.sendMail({
      from: `"${auth.account.display_name || auth.account.email}" <${auth.account.email}>`,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject || "(sem assunto)",
      html: body.html || body.text || "",
      text: body.text || undefined,
      inReplyTo: body.inReplyTo || undefined,
      references: body.references || undefined,
      attachments,
    });

    return json({ ok: true, messageId: info.messageId });
  } catch (e: any) {
    console.error("send err", e);
    return json({ error: e?.message || "erro" }, 500);
  }
});
