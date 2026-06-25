import { ImapFlow } from "npm:imapflow@1.0.171";
import { corsHeaders, json, authSession, getImapConfig } from "../_shared/webmail.ts";

// action: mark_read|mark_unread|star|unstar|delete|move|spam
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authSession(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const body = await req.json();
  const folder = String(body.folder || "INBOX");
  const uids: number[] = (body.uids || []).map((u: any) => Number(u)).filter(Boolean);
  const action = String(body.action || "");
  const target = body.target ? String(body.target) : null;
  if (!uids.length || !action) return json({ error: "invalid" }, 400);

  const client = new ImapFlow(await getImapConfig(auth.account));
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      const uidStr = uids.join(",");
      switch (action) {
        case "mark_read":
          await client.messageFlagsAdd(uidStr, ["\\Seen"], { uid: true });
          break;
        case "mark_unread":
          await client.messageFlagsRemove(uidStr, ["\\Seen"], { uid: true });
          break;
        case "star":
          await client.messageFlagsAdd(uidStr, ["\\Flagged"], { uid: true });
          break;
        case "unstar":
          await client.messageFlagsRemove(uidStr, ["\\Flagged"], { uid: true });
          break;
        case "delete":
          await client.messageFlagsAdd(uidStr, ["\\Deleted"], { uid: true });
          await client.messageDelete(uidStr, { uid: true });
          break;
        case "move":
          if (!target) return json({ error: "target required" }, 400);
          await client.messageMove(uidStr, target, { uid: true });
          break;
        default:
          return json({ error: "unknown action" }, 400);
      }
      return json({ ok: true });
    } finally {
      lock.release();
    }
  } catch (e: any) {
    return json({ error: e?.message || "erro" }, 500);
  } finally {
    try { await client.logout(); } catch {}
  }
});
