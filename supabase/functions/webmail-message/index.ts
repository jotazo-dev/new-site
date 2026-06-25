import { ImapFlow } from "npm:imapflow@1.0.171";
import { corsHeaders, json, authSession, getImapConfig } from "../_shared/webmail.ts";

const TIMEOUTS = {
  connect: 20_000,
  lock: 15_000,
  metadata: 20_000,
  bodyPart: 25_000,
  flag: 5_000,
};

const MAX_BODY_BYTES = 512_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authSession(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const body = await req.json();
  const folder = String(body.folder || "INBOX");
  const uid = Number(body.uid);
  if (!uid) return json({ error: "uid required" }, 400);

  const client = new ImapFlow({ ...(await getImapConfig(auth.account)), socketTimeout: 60_000 });
  const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout: ${label}`)), ms)),
    ]);
  try {
    await withTimeout(client.connect(), TIMEOUTS.connect, "connect");
    const lock = await withTimeout(client.getMailboxLock(folder), TIMEOUTS.lock, "lock");
    try {
      const meta: any = await withTimeout(
        client.fetchOne(String(uid), {
          uid: true,
          flags: true,
          envelope: true,
          internalDate: true,
          bodyStructure: true,
          size: true,
        }, { uid: true }) as any,
        TIMEOUTS.metadata,
        "metadata",
      );
      if (!meta) return json({ error: "not found" }, 404);

      const isReport = isMultipartReport(meta.bodyStructure);
      const htmlPart = !isReport ? pickHtmlPart(meta.bodyStructure) : null;
      let html: string | null = null;
      let text = "";

      if (htmlPart) {
        const r = await withTimeout(readTextPart(client, uid, htmlPart), TIMEOUTS.bodyPart, "body-part").catch(() => null);
        html = r?.content || null;
      } else {
        const textParts = pickAllTextParts(meta.bodyStructure);
        const pieces: string[] = [];
        for (const part of textParts) {
          const r = await withTimeout(readTextPart(client, uid, part), TIMEOUTS.bodyPart, "body-part").catch(() => null);
          if (r?.content) {
            const label = partLabel(part);
            pieces.push(label ? `--- ${label} ---\n${r.content}` : r.content);
          }
        }
        text = pieces.join("\n\n").trim();
      }

      try { await withTimeout(client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true }), TIMEOUTS.flag, "flag"); } catch {}

      return json({
        uid,
        from: meta.envelope?.from || [],
        to: meta.envelope?.to || [],
        cc: meta.envelope?.cc || [],
        subject: meta.envelope?.subject || "",
        date: meta.envelope?.date || meta.internalDate,
        html,
        text,
        messageId: meta.envelope?.messageId || "",
        inReplyTo: meta.envelope?.inReplyTo || "",
        references: [],
        attachments: collectAttachments(meta.bodyStructure).map((a: any, i: number) => ({
          index: i,
          filename: a.filename || `anexo-${i + 1}`,
          contentType: a.contentType,
          size: a.size,
          contentId: a.contentId || null,
          content: null,
        })),
      });
    } finally {
      try { lock.release(); } catch {}
    }
  } catch (e: any) {
    return json({ error: e?.message || "erro" }, 500);
  } finally {
    // close() is non-blocking; avoids logout() hangs that trigger 150s idle timeouts
    try { client.close(); } catch {}
  }
});

function pickHtmlPart(structure: any): any | null {
  return flattenParts(structure).find((part) => {
    const type = String(part.type || "").toLowerCase();
    const disposition = String(part.disposition || "").toLowerCase();
    return disposition !== "attachment" && type === "text/html";
  }) || null;
}

function pickAllTextParts(structure: any): any[] {
  const READABLE = new Set(["text/plain", "text/html", "text/rfc822-headers", "message/delivery-status", "message/rfc822"]);
  return flattenParts(structure).filter((part) => {
    const type = String(part.type || "").toLowerCase();
    const disposition = String(part.disposition || "").toLowerCase();
    return disposition !== "attachment" && READABLE.has(type);
  });
}

function isMultipartReport(structure: any): boolean {
  const type = String(structure?.type || "").toLowerCase();
  return type === "multipart/report";
}

function partLabel(part: any): string {
  const type = String(part.type || "").toLowerCase();
  if (type === "message/delivery-status") return "Delivery status";
  if (type === "text/rfc822-headers") return "Original headers";
  if (type === "message/rfc822") return "Original message";
  return "";
}

function flattenParts(node: any): any[] {
  if (!node) return [];
  if (Array.isArray(node.childNodes) && node.childNodes.length) {
    return node.childNodes.flatMap((child: any) => flattenParts(child));
  }
  return [node];
}

async function readTextPart(client: any, uid: number, part: any): Promise<{ kind: "html" | "text"; content: string }> {
  const partKey = part.part || "TEXT";
  const dl: any = await client.download(String(uid), partKey, { uid: true, maxBytes: MAX_BODY_BYTES });
  if (!dl?.content) return { kind: part.type === "text/html" ? "html" : "text", content: "" };
  const chunks: Uint8Array[] = [];
  for await (const chunk of dl.content as AsyncIterable<Uint8Array>) {
    chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
  }
  const content = concatAndDecode(chunks, dl.meta?.charset || part.parameters?.charset);
  return { kind: String(part.type).toLowerCase() === "text/html" ? "html" : "text", content };
}

function concatAndDecode(chunks: Uint8Array[], charset?: string): string {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return new TextDecoder(normalizeCharset(charset)).decode(out);
  } catch {
    return new TextDecoder().decode(out);
  }
}

function normalizeCharset(charset?: string): string {
  const normalized = String(charset || "utf-8").toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (["iso88591", "latin1", "windows1252"].includes(normalized)) return "windows-1252";
  if (["usascii", "ascii", "utf8"].includes(normalized)) return "utf-8";
  return charset || "utf-8";
}

function collectAttachments(structure: any): any[] {
  return flattenParts(structure)
    .filter((part) => {
      const disposition = String(part.disposition || "").toLowerCase();
      return disposition === "attachment" || Boolean(part.dispositionParameters?.filename || part.parameters?.name);
    })
    .map((part) => ({
      filename: part.dispositionParameters?.filename || part.parameters?.name || "anexo",
      contentType: part.type || "application/octet-stream",
      size: part.size || 0,
      contentId: part.id || null,
    }));
}
