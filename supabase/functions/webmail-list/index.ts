import { ImapFlow } from "npm:imapflow@1.0.171";
import { corsHeaders, json, authSession, getImapConfig } from "../_shared/webmail.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authSession(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const body = await req.json();
  const folder = String(body.folder || "INBOX");
  const limit = Math.min(Number(body.limit || 50), 100);
  const beforeUid = body.beforeUid ? Number(body.beforeUid) : null;

  const client = new ImapFlow(await getImapConfig(auth.account));
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      const mailbox: any = client.mailbox;
      const totalMessages = mailbox.exists || 0;
      const uidNext = mailbox.uidNext || 1;
      const maxUid = beforeUid ? beforeUid - 1 : uidNext - 1;
      const minUid = Math.max(1, maxUid - limit * 4); // overshoot then trim
      const range = `${minUid}:${maxUid}`;
      const messages: any[] = [];
      if (maxUid > 0) {
        for await (const msg of client.fetch(range, {
          uid: true,
          flags: true,
          envelope: true,
          internalDate: true,
          size: true,
          bodyStructure: true,
        }, { uid: true })) {
          messages.push({
            uid: Number(msg.uid),
            flags: Array.from(msg.flags || []),
            from: msg.envelope?.from || [],
            to: msg.envelope?.to || [],
            cc: msg.envelope?.cc || [],
            subject: msg.envelope?.subject || "",
            date: msg.envelope?.date || msg.internalDate,
            messageId: msg.envelope?.messageId || "",
            inReplyTo: msg.envelope?.inReplyTo || "",
            size: msg.size || 0,
            hasAttachments: hasAttachments(msg.bodyStructure),
          });
        }
      }
      messages.sort((a, b) => b.uid - a.uid);
      const trimmed = messages.slice(0, limit);
      return json({ messages: trimmed, total: totalMessages, uidNext });
    } finally {
      lock.release();
    }
  } catch (e: any) {
    return json({ error: e?.message || "erro" }, 500);
  } finally {
    try { await client.logout(); } catch {}
  }
});

function hasAttachments(structure: any): boolean {
  if (!structure) return false;
  if (structure.disposition === "attachment") return true;
  if (Array.isArray(structure.childNodes)) {
    return structure.childNodes.some((c: any) => hasAttachments(c));
  }
  return false;
}
