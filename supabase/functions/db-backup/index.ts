// Full database backup (ZIP of CSVs + schema.sql) and schema-only (.sql) export.
// Admin-only. Uses direct Postgres connection via SUPABASE_DB_URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;

const sql = postgres(DB_URL, { max: 2, idle_timeout: 20, prepare: false });

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (v instanceof Date) s = v.toISOString();
  else if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return head + "\n" + body + "\n";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth: admin only
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json(401, { error: "missing token" });
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json(401, { error: "invalid token" });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json(403, { error: "forbidden" });

    const mode = new URL(req.url).searchParams.get("mode") ?? "full";

    // Tables in public
    const tableRows = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tables = tableRows.map((r) => r.table_name);

    // Columns for schema dump
    const colRows = await sql<
      { table_name: string; column_name: string; data_type: string; is_nullable: string; column_default: string | null }[]
    >`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    const colsByTable: Record<string, typeof colRows> = {};
    for (const c of colRows) (colsByTable[c.table_name] ||= [] as any).push(c);

    const schemaLines: string[] = [
      "-- Schema dump (public)",
      "-- Generated: " + new Date().toISOString(),
      "-- Tables: " + tables.length,
      "",
    ];
    for (const t of tables) {
      const tc = colsByTable[t] ?? [];
      if (!tc.length) continue;
      schemaLines.push(`-- Table: public.${t}`);
      schemaLines.push(`CREATE TABLE IF NOT EXISTS public."${t}" (`);
      schemaLines.push(
        tc.map((c) =>
          `  "${c.column_name}" ${c.data_type}` +
          (c.is_nullable === "NO" ? " NOT NULL" : "") +
          (c.column_default ? ` DEFAULT ${c.column_default}` : "")
        ).join(",\n"),
      );
      schemaLines.push(");");
      schemaLines.push("");
    }
    const schemaText = schemaLines.join("\n");

    if (mode === "schema") {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      return new Response(schemaText, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename="db-schema-${stamp}.sql"`,
        },
      });
    }

    // Full mode: CSVs + schema + manifest
    const zip = new JSZip();
    const dataFolder = zip.folder("data")!;
    const summary: { table: string; rows: number; error?: string }[] = [];

    for (const t of tables) {
      try {
        const rows = await sql.unsafe(`SELECT * FROM public."${t}"`) as unknown as Record<string, unknown>[];
        dataFolder.file(`${t}.csv`, rowsToCsv(rows));
        summary.push({ table: t, rows: rows.length });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        dataFolder.file(`${t}.csv`, `# ERROR: ${msg}\n`);
        summary.push({ table: t, rows: 0, error: msg });
      }
    }

    // Policies (RLS)
    const policies = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;
    const policiesSql = [
      "-- RLS Policies (public)",
      "-- Generated: " + new Date().toISOString(),
      "",
      ...policies.map((p: any) => {
        const roles = Array.isArray(p.roles) ? p.roles.join(", ") : String(p.roles ?? "");
        const using = p.qual ? ` USING (${p.qual})` : "";
        const wc = p.with_check ? ` WITH CHECK (${p.with_check})` : "";
        return `-- ${p.tablename}.${p.policyname}\nCREATE POLICY "${p.policyname}" ON public."${p.tablename}"\n  AS ${p.permissive} FOR ${p.cmd} TO ${roles}${using}${wc};\n`;
      }),
    ].join("\n");

    // Triggers
    const triggers = await sql`
      SELECT event_object_table AS table_name, trigger_name, event_manipulation,
             action_timing, action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `;
    const triggersSql = [
      "-- Triggers (public)",
      "-- Generated: " + new Date().toISOString(),
      "",
      ...triggers.map((t: any) =>
        `-- ${t.table_name}.${t.trigger_name}\nCREATE TRIGGER ${t.trigger_name} ${t.action_timing} ${t.event_manipulation}\n  ON public."${t.table_name}" FOR EACH ROW ${t.action_statement};\n`
      ),
    ].join("\n");

    // Functions
    const funcs = await sql`
      SELECT p.proname AS name, pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      ORDER BY p.proname
    `;
    const functionsSql = [
      "-- Functions (public)",
      "-- Generated: " + new Date().toISOString(),
      "",
      ...funcs.map((f: any) => `-- ${f.name}\n${f.definition};\n`),
    ].join("\n");

    // Indexes
    const indexes = await sql`
      SELECT indexdef FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    const indexesSql = [
      "-- Indexes (public)",
      "-- Generated: " + new Date().toISOString(),
      "",
      ...indexes.map((i: any) => `${i.indexdef};`),
    ].join("\n");

    // Grants
    const grants = await sql`
      SELECT grantee, table_name, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND grantee IN ('anon','authenticated','service_role')
      ORDER BY table_name, grantee, privilege_type
    `;
    const grantsSql = [
      "-- Grants (public)",
      "-- Generated: " + new Date().toISOString(),
      "",
      ...grants.map((g: any) => `GRANT ${g.privilege_type} ON public."${g.table_name}" TO ${g.grantee};`),
    ].join("\n");

    // Auth users (no password hashes)
    const authUsers: any[] = [];
    try {
      let page = 1;
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) break;
        const users = data?.users ?? [];
        authUsers.push(...users.map((u) => ({
          id: u.id, email: u.email, phone: u.phone,
          created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
          user_metadata: u.user_metadata, app_metadata: u.app_metadata,
        })));
        if (users.length < 1000) break;
        page++;
        if (page > 50) break;
      }
    } catch (_) { /* ignore */ }

    // Storage inventory (metadata only)
    const storageInventory = await sql`
      SELECT b.id AS bucket, b.public, o.name AS path,
             (o.metadata->>'size')::bigint AS size_bytes,
             o.metadata->>'mimetype' AS mime, o.created_at
      FROM storage.buckets b
      LEFT JOIN storage.objects o ON o.bucket_id = b.id
      ORDER BY b.id, o.name
    `.catch(() => [] as any);

    // Media download (mode=full-media): pull every storage object into storage/<bucket>/<path>
    // STORE (no compression) since most assets are already compressed (images, pdf, zip).
    // Sequential downloads to keep memory peak low.
    const mediaSummary: { bucket: string; path: string; bytes: number; error?: string }[] = [];
    if (mode === "full-media") {
      const mediaFolder = zip.folder("storage")!;
      const objects = (storageInventory as any[]).filter((o) => o.bucket && o.path);
      for (const o of objects) {
        try {
          const { data, error } = await admin.storage.from(o.bucket).download(o.path);
          if (error || !data) throw error ?? new Error("no data");
          const buf = new Uint8Array(await data.arrayBuffer());
          mediaFolder.file(`${o.bucket}/${o.path}`, buf, { compression: "STORE" });
          mediaSummary.push({ bucket: o.bucket, path: o.path, bytes: buf.byteLength });
        } catch (e: any) {
          mediaSummary.push({ bucket: o.bucket, path: o.path, bytes: 0, error: e?.message ?? String(e) });
        }
      }
    }

    zip.file("schema.sql", schemaText);
    zip.file("policies.sql", policiesSql);
    zip.file("triggers.sql", triggersSql);
    zip.file("functions.sql", functionsSql);
    zip.file("indexes.sql", indexesSql);
    zip.file("grants.sql", grantsSql);
    zip.file("auth-users.json", JSON.stringify(authUsers, null, 2));
    zip.file("storage-inventory.json", JSON.stringify(storageInventory, null, 2));
    zip.file("manifest.json", JSON.stringify({
      generated_at: new Date().toISOString(),
      mode,
      tables: summary,
      counts: {
        tables: tables.length,
        policies: policies.length,
        triggers: triggers.length,
        functions: funcs.length,
        indexes: indexes.length,
        auth_users: authUsers.length,
        storage_objects: (storageInventory as any[]).length,
        media_downloaded: mediaSummary.filter((m) => !m.error).length,
        media_failed: mediaSummary.filter((m) => m.error).length,
      },
      media: mode === "full-media" ? mediaSummary : undefined,
    }, null, 2));
    zip.file(
      "README.txt",
      [
        "Backup logico (schema public + auth users + storage)",
        `Modo: ${mode}`,
        "Gerado em: " + new Date().toISOString(),
        `Tabelas: ${tables.length} | Linhas: ${summary.reduce((a, b) => a + b.rows, 0)}`,
        `Policies: ${policies.length} | Triggers: ${triggers.length} | Functions: ${funcs.length} | Indexes: ${indexes.length}`,
        `Auth users: ${authUsers.length} | Storage objects: ${(storageInventory as any[]).length}`,
        mode === "full-media"
          ? `Midias baixadas: ${mediaSummary.filter((m) => !m.error).length} / ${mediaSummary.length}`
          : "Midias: NAO incluidas (apenas inventario). Use mode=full-media para baixar.",
        "",
        "Conteudo:",
        "- data/<tabela>.csv      : linhas de cada tabela public",
        "- schema.sql             : CREATE TABLE (estrutura)",
        "- policies.sql           : RLS policies",
        "- triggers.sql           : triggers",
        "- functions.sql          : funcoes (pg_get_functiondef)",
        "- indexes.sql            : indices",
        "- grants.sql             : permissoes anon/authenticated/service_role",
        "- auth-users.json        : usuarios (sem hashes de senha)",
        "- storage-inventory.json : listagem de buckets/objetos",
        mode === "full-media" ? "- storage/<bucket>/...   : arquivos binarios reais dos buckets" : "",
        "- manifest.json          : resumo",
        "",
        "NAO inclui: hashes de senha, secrets, ou codigo das edge functions (esta no Git).",
      ].filter(Boolean).join("\n"),
    );

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = mode === "full-media" ? `db-backup-completo-${stamp}.zip` : `db-backup-${stamp}.zip`;

    // Stream the zip directly to the response to avoid buffering the entire archive in memory.
    const internal = zip.generateInternalStream({
      type: "uint8array",
      streamFiles: true,
      compression: mode === "full-media" ? "STORE" : "DEFLATE",
    });
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        internal
          .on("data", (chunk: Uint8Array) => controller.enqueue(chunk))
          .on("error", (err: any) => controller.error(err))
          .on("end", () => controller.close());
        internal.resume();
      },
      cancel() { try { internal.pause(); } catch (_) {} },
    });

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return json(500, { error: e?.message ?? String(e) });
  }
});
