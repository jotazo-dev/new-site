import { corsHeaders, json, authSession } from "../_shared/webmail.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authSession(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  try {
    const body = await req.json();
    const action = body?.action || "get";
    const accountEmail = auth.account.email as string;
    if (action === "get") {
      const { data } = await auth.sb
        .from("webmail_signatures")
        .select("html, enabled")
        .eq("account_email", accountEmail)
        .maybeSingle();
      return json({ html: data?.html || "", enabled: data?.enabled ?? true });
    }
    if (action === "upsert") {
      const html = typeof body.html === "string" ? body.html.slice(0, 50000) : "";
      const enabled = body.enabled !== false;
      const { error } = await auth.sb
        .from("webmail_signatures")
        .upsert({ account_email: accountEmail, html, enabled }, { onConflict: "account_email" });
      if (error) throw error;
      return json({ ok: true, html, enabled });
    }
    return json({ error: "invalid action" }, 400);
  } catch (e: any) {
    console.error("signature err", e);
    return json({ error: e?.message || "erro" }, 500);
  }
});
