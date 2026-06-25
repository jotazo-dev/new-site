import { corsHeaders, json, getServiceClient, hashToken } from "../_shared/webmail.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const token = req.headers.get("x-webmail-token");
  if (token) {
    const sb = getServiceClient();
    await sb.from("webmail_sessions").delete().eq("token_hash", await hashToken(token));
  }
  return json({ ok: true });
});
