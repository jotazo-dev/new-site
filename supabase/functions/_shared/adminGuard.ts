import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsJson = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

/**
 * Allows access to any authenticated user that has a row in public.user_roles
 * (admin, moderator or any custom collaborator role). Per-section permission
 * gating is enforced on the client via AdminRouteGuard + role_permissions.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsJson });
  }
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsJson });
    }

    // Use service role to read user_roles (RLS only exposes own row to user; service role bypasses it consistently)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role, role_slug")
      .eq("user_id", user.id)
      .maybeSingle();

    const slug = (roleRow as any)?.role_slug || (roleRow as any)?.role;
    if (!slug) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsJson });
    }
    return null;
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsJson });
  }
}
