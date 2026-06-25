// Public: resolves CPF/CNPJ to the auth email so user can sign in with document.
// Returns { email } when a customer_profiles row exists and links to an auth user.
// Returns { found: false } otherwise. No PII beyond the email itself is exposed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function onlyDigits(s: string) { return String(s || "").replace(/\D+/g, ""); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { document } = await req.json().catch(() => ({}));
    const doc = onlyDigits(String(document || ""));
    if (doc.length !== 11 && doc.length !== 14) {
      return new Response(JSON.stringify({ found: false, error: "invalid_doc" }), { status: 400, headers: corsHeaders });
    }

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: prof } = await supa
      .from("customer_profiles")
      .select("user_id")
      .eq("cpf_cnpj", doc)
      .maybeSingle();

    if (!prof?.user_id) {
      return new Response(JSON.stringify({ found: false }), { headers: corsHeaders });
    }

    const { data: userRes } = await supa.auth.admin.getUserById(prof.user_id);
    const email = userRes?.user?.email || null;
    if (!email) {
      return new Response(JSON.stringify({ found: false }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ found: true, email }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ found: false, error: "exception", message: (e as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
