import { ImapFlow } from "npm:imapflow@1.0.171";
import { corsHeaders, json, getServiceClient, encrypt, hashToken } from "../_shared/webmail.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const imapHost = String(body.imap_host || "mail.jotazo.com");
    const imapPort = Number(body.imap_port || 993);
    const smtpHost = String(body.smtp_host || "mail.jotazo.com");
    const smtpPort = Number(body.smtp_port || 465);
    if (!email.includes("@") || !password) return json({ error: "Email e senha obrigatórios" }, 400);

    // Validate IMAP login
    const tryConnect = async (opts: any) => {
      const c = new ImapFlow(opts);
      await c.connect();
      await c.logout();
    };
    const baseOpts: any = {
      host: imapHost,
      port: imapPort,
      secure: imapPort === 993,
      auth: { user: email, pass: password },
      logger: false,
      tls: { rejectUnauthorized: false, servername: imapHost },
    };
    try {
      await tryConnect(baseOpts);
    } catch (e1: any) {
      console.error("IMAP fail 1", e1?.message, e1?.responseText, e1?.authenticationFailed);
      try {
        await tryConnect({ ...baseOpts, disableAutoEnable: true });
      } catch (e2: any) {
        console.error("IMAP fail 2", e2?.message, e2?.responseText, e2?.authenticationFailed, e2?.response);
        const detail = e2?.responseText || e2?.response || e2?.message || "desconhecido";
        return json({ error: "Falha de autenticação IMAP: " + detail }, 401);
      }
    }

    const sb = getServiceClient();
    const encPwd = await encrypt(password);

    // Upsert account
    const { data: existing } = await sb.from("webmail_accounts").select("id").eq("email", email).maybeSingle();
    let accountId: string;
    if (existing) {
      await sb.from("webmail_accounts").update({
        encrypted_password: encPwd,
        imap_host: imapHost, imap_port: imapPort, imap_secure: true,
        smtp_host: smtpHost, smtp_port: smtpPort, smtp_secure: true,
        last_login_at: new Date().toISOString(),
      }).eq("id", existing.id);
      accountId = existing.id;
    } else {
      const { data: created, error } = await sb.from("webmail_accounts").insert({
        email,
        display_name: email.split("@")[0],
        encrypted_password: encPwd,
        imap_host: imapHost, imap_port: imapPort, imap_secure: true,
        smtp_host: smtpHost, smtp_port: smtpPort, smtp_secure: true,
        last_login_at: new Date().toISOString(),
      }).select("id").single();
      if (error) return json({ error: error.message }, 500);
      accountId = created.id;
    }

    // Issue session token (30 days)
    const token = crypto.randomUUID() + "." + crypto.randomUUID();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from("webmail_sessions").insert({
      account_id: accountId,
      token_hash: tokenHash,
      user_agent: req.headers.get("user-agent") || "",
      ip: req.headers.get("x-forwarded-for") || "",
      expires_at: expiresAt,
    });

    return json({ token, account: { id: accountId, email } });
  } catch (e: any) {
    console.error("webmail-login error", e);
    return json({ error: e?.message || "Erro" }, 500);
  }
});
