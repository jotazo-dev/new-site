import { ImapFlow } from "npm:imapflow@1.0.171";
import { corsHeaders, json, authSession, getImapConfig } from "../_shared/webmail.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authSession(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const client = new ImapFlow(await getImapConfig(auth.account));
  try {
    await client.connect();
    const list = await client.list();
    const folders = list.map((f: any) => ({
      path: f.path,
      name: f.name,
      delimiter: f.delimiter,
      specialUse: f.specialUse || null,
      subscribed: f.subscribed,
      flags: f.flags ? Array.from(f.flags) : [],
    }));

    // Fetch unseen for every selectable folder
    const unseenByFolder: Record<string, number> = {};
    await Promise.all(
      list.map(async (f: any) => {
        const flags: string[] = f.flags ? Array.from(f.flags) : [];
        if (flags.includes("\\Noselect")) return;
        try {
          const status = await client.status(f.path, { unseen: true });
          unseenByFolder[f.path] = (status as any).unseen || 0;
        } catch {}
      }),
    );

    await client.logout();
    return json({
      folders,
      unseenByFolder,
      inboxUnseen: unseenByFolder["INBOX"] || 0,
    });
  } catch (e: any) {
    try { await client.logout(); } catch {}
    return json({ error: e?.message || "erro" }, 500);
  }
});
