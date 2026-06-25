import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const TOKEN_KEY = "webmail_token";
const ACCOUNT_KEY = "webmail_account";

function storage(persist: boolean) {
  return persist ? localStorage : sessionStorage;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getAccount(): { id: string; email: string } | null {
  try {
    const v = localStorage.getItem(ACCOUNT_KEY) || sessionStorage.getItem(ACCOUNT_KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, account: { id: string; email: string }, persist = true) {
  const s = storage(persist);
  s.setItem(TOKEN_KEY, token);
  s.setItem(ACCOUNT_KEY, JSON.stringify(account));
  if (persist) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ACCOUNT_KEY);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ACCOUNT_KEY);
}

async function call(fn: string, body?: any, requireAuth = true): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
  };
  if (requireAuth) {
    const t = getToken();
    if (!t) throw new Error("Sessão expirada");
    headers["x-webmail-token"] = t;
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export const webmailApi = {
  login: (p: { email: string; password: string; imap_host?: string; smtp_host?: string }) =>
    call("webmail-login", p, false),
  logout: () => call("webmail-logout"),
  folders: () => call("webmail-folders"),
  list: (folder: string, opts: { limit?: number; beforeUid?: number } = {}) =>
    call("webmail-list", { folder, ...opts }),
  message: (folder: string, uid: number) => call("webmail-message", { folder, uid }),
  send: (p: any) => call("webmail-send", p),
  action: (p: { folder: string; uids: number[]; action: string; target?: string }) =>
    call("webmail-action", p),
  contacts: (body: any) => call("webmail-contacts", body),
  signature: (body: any) => call("webmail-signature", body),
  attachmentAction: (body: any) => call("webmail-upload-attachment", body),
};

export async function uploadAttachment(file: File, draftId: string) {
  const t = getToken();
  if (!t) throw new Error("Sessão expirada");
  const fd = new FormData();
  fd.append("draft_id", draftId);
  fd.append("file", file);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/webmail-upload-attachment`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "x-webmail-token": t },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as { ok: true; path: string; name: string; size: number; contentType: string };
}
