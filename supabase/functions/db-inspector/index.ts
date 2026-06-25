// Admin-only database inspector. The frontend NEVER sends SQL — only a
// whitelisted `action` string. All queries run server-side using the
// service-role connection. Auth: any user with a row in `public.user_roles`
// (granular section gating happens client-side via AdminRouteGuard).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;

// Single shared pooled connection. Postgres.js connects lazily.
const sql = postgres(DB_URL, { max: 3, idle_timeout: 20, prepare: false });

async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "Unauthorized" });
  try {
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json(401, { error: "Unauthorized" });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!roleRow) return json(403, { error: "Forbidden" });
    return null;
  } catch {
    return json(401, { error: "Unauthorized" });
  }
}

// ─────────────────────────── Actions ───────────────────────────

async function getOverview() {
  const [dbSize, tables, walSize, conns, deadlocks, txStats, uptime] =
    await Promise.all([
      sql`SELECT pg_database_size(current_database())::bigint AS bytes`,
      sql`SELECT count(*)::int AS n FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE c.relkind = 'r' AND n.nspname = 'public'`,
      sql`SELECT COALESCE(SUM(size)::bigint, 0) AS bytes
           FROM pg_ls_waldir()`.catch(() => [{ bytes: 0 }]),
      sql`SELECT
            count(*) FILTER (WHERE state='active')::int AS active,
            count(*) FILTER (WHERE state='idle')::int AS idle,
            count(*)::int AS total,
            (SELECT setting::int FROM pg_settings WHERE name='max_connections') AS max
           FROM pg_stat_activity WHERE datname = current_database()`,
      sql`SELECT deadlocks, xact_rollback, xact_commit
           FROM pg_stat_database WHERE datname = current_database()`,
      sql`SELECT pg_postmaster_start_time() AS started`,
      sql`SELECT version() AS version`,
    ]);
  return {
    db_size_bytes: Number(dbSize[0].bytes),
    table_count: tables[0].n,
    wal_bytes: Number(walSize[0].bytes ?? 0),
    connections: conns[0],
    deadlocks: Number(deadlocks[0].deadlocks),
    rollbacks: Number(deadlocks[0].xact_rollback),
    commits: Number(deadlocks[0].xact_commit),
    postmaster_started: txStats[0].started,
    version: uptime[0].version,
  };
}

async function getTables() {
  const rows = await sql`
    SELECT
      c.relname AS name,
      c.relrowsecurity AS rls_enabled,
      pg_total_relation_size(c.oid)::bigint AS size_bytes,
      c.reltuples::bigint AS est_rows,
      (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema='public' AND table_name=c.relname) AS column_count,
      (SELECT count(*)::int FROM pg_policies
         WHERE schemaname='public' AND tablename=c.relname) AS policy_count,
      (SELECT count(*)::int FROM pg_indexes
         WHERE schemaname='public' AND tablename=c.relname) AS index_count,
      GREATEST(
        COALESCE(s.last_vacuum, '1970-01-01'::timestamptz),
        COALESCE(s.last_autovacuum, '1970-01-01'::timestamptz),
        COALESCE(s.last_analyze, '1970-01-01'::timestamptz)
      ) AS last_maintenance
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE c.relkind='r' AND n.nspname='public'
    ORDER BY pg_total_relation_size(c.oid) DESC
  `;
  return rows.map((r) => ({
    ...r,
    size_bytes: Number(r.size_bytes),
    est_rows: Number(r.est_rows),
  }));
}

async function getTableDetail(table: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(table)) throw new Error("Invalid table name");
  const [columns, indexes, policies, fks, grants, triggers, exactCount] =
    await Promise.all([
      sql`SELECT column_name, data_type, is_nullable, column_default, ordinal_position
           FROM information_schema.columns
           WHERE table_schema='public' AND table_name=${table}
           ORDER BY ordinal_position`,
      sql`SELECT indexname, indexdef FROM pg_indexes
           WHERE schemaname='public' AND tablename=${table}`,
      sql`SELECT policyname, cmd, roles, permissive, qual, with_check
           FROM pg_policies WHERE schemaname='public' AND tablename=${table}`,
      sql`SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu
             ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
           JOIN information_schema.constraint_column_usage ccu
             ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
           WHERE tc.table_schema='public' AND tc.table_name=${table}
             AND tc.constraint_type='FOREIGN KEY'`,
      sql`SELECT grantee, privilege_type
           FROM information_schema.role_table_grants
           WHERE table_schema='public' AND table_name=${table}
             AND grantee IN ('anon','authenticated','service_role')
           ORDER BY grantee, privilege_type`,
      sql`SELECT trigger_name, event_manipulation, action_timing, action_statement
           FROM information_schema.triggers
           WHERE event_object_schema='public' AND event_object_table=${table}`,
      sql.unsafe(`SELECT count(*)::bigint AS n FROM public."${table}"`).catch(() => [{ n: 0 }]),
    ]);
  return {
    columns,
    indexes,
    policies,
    foreign_keys: fks,
    grants,
    triggers,
    row_count: Number((exactCount as any)[0].n),
  };
}

async function getFunctions() {
  const rows = await sql`
    SELECT
      p.proname AS name,
      pg_get_function_result(p.oid) AS return_type,
      pg_get_function_arguments(p.oid) AS arguments,
      l.lanname AS language,
      p.prosecdef AS security_definer,
      p.provolatile AS volatility,
      array_to_string(p.proconfig, ', ') AS config
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname='public'
    ORDER BY p.proname
  `;
  return rows;
}

async function getTriggers() {
  const rows = await sql`
    SELECT event_object_table AS table_name, trigger_name,
           event_manipulation, action_timing, action_statement
    FROM information_schema.triggers
    WHERE trigger_schema='public'
    ORDER BY event_object_table, trigger_name
  `;
  return rows;
}

async function getStorage() {
  const rows = await sql`
    SELECT b.id, b.name, b.public, b.created_at,
      COALESCE((SELECT count(*)::int FROM storage.objects o WHERE o.bucket_id=b.id), 0) AS object_count,
      COALESCE((SELECT SUM((o.metadata->>'size')::bigint) FROM storage.objects o WHERE o.bucket_id=b.id), 0)::bigint AS total_bytes
    FROM storage.buckets b
    ORDER BY b.name
  `;
  return rows.map((r) => ({ ...r, total_bytes: Number(r.total_bytes) }));
}

async function getSlowQueries(limit = 20) {
  try {
    const rows = await sql`
      SELECT query, calls, total_exec_time, mean_exec_time, max_exec_time, rows
      FROM pg_stat_statements
      WHERE query NOT ILIKE '%pg_stat_statements%'
      ORDER BY total_exec_time DESC
      LIMIT ${limit}
    `;
    return { available: true, rows };
  } catch (e) {
    return { available: false, error: String(e), rows: [] };
  }
}

async function getIndexUsage() {
  const rows = await sql`
    SELECT schemaname, relname AS table, indexrelname AS index,
           idx_scan, idx_tup_read, pg_relation_size(indexrelid)::bigint AS size_bytes
    FROM pg_stat_user_indexes
    WHERE schemaname='public'
    ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
    LIMIT 50
  `;
  return rows.map((r) => ({ ...r, size_bytes: Number(r.size_bytes) }));
}

async function getRecentLogs(table: string, limit = 50) {
  const allowed: Record<string, string> = {
    asaas_logs: "SELECT id, created_at, action, http_status, http_method, endpoint FROM public.asaas_logs ORDER BY created_at DESC LIMIT $1",
    eai_logs: "SELECT id, created_at, action, http_status, endpoint FROM public.eai_logs ORDER BY created_at DESC LIMIT $1",
  };
  const q = allowed[table];
  if (!q) return [];
  return await sql.unsafe(q, [limit]);
}

// ─────────────────────────── Router ───────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const guard = await requireAdmin(req);
  if (guard) return guard;
  try {
    const { action, params } = await req.json();
    switch (action) {
      case "overview": return json(200, await getOverview());
      case "tables": return json(200, await getTables());
      case "table_detail": return json(200, await getTableDetail(params?.table));
      case "functions": return json(200, await getFunctions());
      case "triggers": return json(200, await getTriggers());
      case "storage": return json(200, await getStorage());
      case "slow_queries": return json(200, await getSlowQueries(params?.limit ?? 20));
      case "index_usage": return json(200, await getIndexUsage());
      case "recent_logs": return json(200, await getRecentLogs(params?.table, params?.limit ?? 50));
      default: return json(400, { error: "Unknown action" });
    }
  } catch (e) {
    console.error("db-inspector error:", e);
    return json(500, { error: String((e as Error).message ?? e) });
  }
});
