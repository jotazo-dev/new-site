// Shared helpers for webmail edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webmail-token",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function getKey(): Promise<CryptoKey> {
  const raw =
    Deno.env.get("WEBMAIL_ENCRYPTION_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    "fallback-dev-key";
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encrypt(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain),
  );
  const out = new Uint8Array(iv.length + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...out));
}

export async function decrypt(b64: string): Promise<string> {
  const key = await getKey();
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

export async function hashToken(token: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return btoa(String.fromCharCode(...new Uint8Array(h)));
}

export async function authSession(req: Request) {
  const token = req.headers.get("x-webmail-token");
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const sb = getServiceClient();
  const { data: session } = await sb
    .from("webmail_sessions")
    .select("id, account_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;
  const { data: account } = await sb
    .from("webmail_accounts")
    .select("*")
    .eq("id", session.account_id)
    .maybeSingle();
  if (!account) return null;
  await sb.from("webmail_sessions").update({ last_used_at: new Date().toISOString() }).eq("id", session.id);
  return { session, account, sb };
}

export async function getImapConfig(account: any) {
  const password = await decrypt(account.encrypted_password);
  return {
    host: account.imap_host,
    port: account.imap_port,
    secure: account.imap_secure,
    auth: { user: account.email, pass: password },
    logger: false,
  };
}

export async function getSmtpConfig(account: any) {
  const password = await decrypt(account.encrypted_password);
  return {
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.smtp_secure,
    auth: { user: account.email, pass: password },
  };
}
