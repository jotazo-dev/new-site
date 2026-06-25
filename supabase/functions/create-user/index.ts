import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");

    const { email, password, role, role_slug, first_name, last_name, avatar_url } = await req.json();
    if (!email || !password) throw new Error("Email and password required");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;

    const targetSlug: string = (role_slug || role || "user").toString();

    if (newUser.user && targetSlug !== "user") {
      const { data: roleRow } = await adminClient
        .from("custom_roles")
        .select("slug")
        .eq("slug", targetSlug)
        .maybeSingle();

      const finalSlug = roleRow?.slug || "user";
      const enumRole =
        finalSlug === "admin" ? "admin" :
        finalSlug === "moderator" ? "moderator" : "user";

      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: enumRole, role_slug: finalSlug });
      if (roleError) throw roleError;
    } else if (newUser.user) {
      await adminClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: "user", role_slug: "user" });
    }

    // Upsert profile (trigger creates an empty row, we fill it in)
    if (newUser.user && (first_name || last_name || avatar_url)) {
      await adminClient
        .from("profiles")
        .upsert({
          user_id: newUser.user.id,
          first_name: first_name || null,
          last_name: last_name || null,
          avatar_url: avatar_url || null,
        }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({ id: newUser.user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
