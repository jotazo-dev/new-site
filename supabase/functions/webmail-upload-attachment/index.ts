import { corsHeaders, json, authSession } from "../_shared/webmail.ts";

const BUCKET = "webmail-attachments";
const MAX_BYTES = 20 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authSession(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const email = auth.account.email as string;
  const safeEmail = email.replace(/[^a-zA-Z0-9.@_-]/g, "_");
  try {
    const ct = req.headers.get("content-type") || "";
    // Multipart upload
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const draftId = String(form.get("draft_id") || "general").replace(/[^a-zA-Z0-9-]/g, "");
      const file = form.get("file") as File | null;
      if (!file) return json({ error: "missing file" }, 400);
      if (file.size > MAX_BYTES) return json({ error: "file too large" }, 413);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const path = `drafts/${safeEmail}/${draftId}/${Date.now()}_${safeName(file.name)}`;
      const { error } = await auth.sb.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) throw error;
      return json({
        ok: true,
        path,
        name: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }
    // JSON actions
    const body = await req.json();
    const action = body?.action;
    if (action === "delete") {
      const path = String(body.path || "");
      if (!path.startsWith(`drafts/${safeEmail}/`)) return json({ error: "forbidden" }, 403);
      const { error } = await auth.sb.storage.from(BUCKET).remove([path]);
      if (error) throw error;
      return json({ ok: true });
    }
    if (action === "fetch_base64") {
      const path = String(body.path || "");
      if (!path.startsWith(`drafts/${safeEmail}/`)) return json({ error: "forbidden" }, 403);
      const { data, error } = await auth.sb.storage.from(BUCKET).download(path);
      if (error) throw error;
      const ab = await data.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
      return json({ ok: true, content_base64: b64 });
    }
    if (action === "cleanup_draft") {
      const draftId = String(body.draft_id || "").replace(/[^a-zA-Z0-9-]/g, "");
      if (!draftId) return json({ error: "missing draft_id" }, 400);
      const prefix = `drafts/${safeEmail}/${draftId}`;
      const { data: list } = await auth.sb.storage.from(BUCKET).list(prefix);
      if (list && list.length) {
        await auth.sb.storage.from(BUCKET).remove(list.map((o: any) => `${prefix}/${o.name}`));
      }
      return json({ ok: true });
    }
    return json({ error: "invalid action" }, 400);
  } catch (e: any) {
    console.error("upload-attachment err", e);
    return json({ error: e?.message || "erro" }, 500);
  }
});
