// Lista clientes OFFLINE na RBX (v1) usando o endpoint oficial documentado:
//   ConsultaClienteOnline → { Codigo, Nome, Online, NasConectados }
// Regra: offline somente quando Online === "N". Não inferir por autenticações ou filtros não documentados.
// Admin-only. POST {} → { ok, total, by_client, by_region, by_olt, by_nas, total_1h_ago, delta_pct, alert, fetched_at }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type Bucket = { key: string; count: number };

function extractList(p: any): any[] {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  for (const k of ["result", "Result", "data", "Data", "registros", "Registros", "lista", "Lista"]) {
    const v = (p as any)[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      for (const k2 of Object.keys(v)) if (Array.isArray((v as any)[k2])) return (v as any)[k2];
    }
  }
  for (const k of Object.keys(p)) if (Array.isArray((p as any)[k])) return (p as any)[k];
  return [];
}

function getStr(row: any, keys: string[]): string {
  for (const k of keys) {
    const v = row?.[k];
    if (v != null && String(v).trim().length > 0) return String(v).trim();
  }
  return "";
}

function rankTop(values: string[], topN = 5): Bucket[] {
  const map = new Map<string, number>();
  for (const v of values) {
    const key = v || "Não informado";
    map.set(key, (map.get(key) || 0) + 1);
  }
  const all = Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
  if (all.length <= topN) return all;
  const top = all.slice(0, topN);
  const rest = all.slice(topN).reduce((s, b) => s + b.count, 0);
  if (rest > 0) top.push({ key: "Outros", count: rest });
  return top;
}

async function rbxCall(endpoint: string, authKey: string, service: string, filtro: string | null, timeoutMs = 20000) {
  const inner: Record<string, unknown> = { Autenticacao: { ChaveIntegracao: authKey } };
  if (filtro !== null) inner.Filtro = filtro.trim();
  const body = JSON.stringify({ [service]: inner });
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": "Jotazo-RBX/1.0" },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return null; }
  } catch (e) {
    console.warn(`[rbx-clientes-offline] ${service} failed:`, (e as Error).message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaSrv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supaUrl, supaSrv);

    const { data: cfg } = await supa
      .from("rbx_config")
      .select("base_url, auth_key_v1")
      .limit(1)
      .maybeSingle();

    if (!cfg?.base_url || !cfg.auth_key_v1) {
      return new Response(
        JSON.stringify({ ok: false, error: "rbx_not_configured", message: "RBX não configurado." }),
        { headers: corsHeaders, status: 200 },
      );
    }

    const endpoint = `${cfg.base_url.replace(/\/+$/, "")}/routerbox/ws/rbx_server_json.php`;

    // Debug mode (admin-only): retorna amostras brutas para inspecionar nomes de campos reais.
    const url = new URL(req.url);
    const isDebug = url.searchParams.get("debug") === "1";

    // Fonte oficial na documentação RBX: ConsultaClienteOnline.
    // Não usar filtro Online='N': em algumas bases a RBX retorna Erro(165) para esse campo no WHERE.
    // Consultamos a lista e filtramos localmente pelo campo real Online (S/N), conforme docs.
    const onlineRes = await rbxCall(endpoint, cfg.auth_key_v1, "ConsultaClienteOnline", null, 45000);

    if (!onlineRes) {
      return new Response(
        JSON.stringify({ ok: false, error: "network", message: "Falha ao consultar RBX." }),
        { headers: corsHeaders, status: 200 },
      );
    }

    const status = onlineRes?.status;
    const isOk = status === 1 || status === "1" || status === true;
    const errCode = Number(onlineRes?.erro_code);

    if (!isOk && errCode !== 1) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "rbx_error",
          code: errCode,
          message: String(onlineRes?.erro_desc || "Falha RBX"),
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    const allRows = isOk ? extractList(onlineRes?.result ?? onlineRes) : [];

    // Documentação RBX: Online indica S=on-line, N=off-line.
    const isOffline = (r: any): boolean => getStr(r, ["Online", "online", "OnLine"]).toUpperCase() === "N";
    const offlineRows = allRows.filter(isOffline);
    const codes = Array.from(new Set(
      offlineRows
        .map((r) => getStr(r, ["Codigo", "codigo", "Cliente", "cliente", "CodigoCliente", "codigo_cliente"]))
        .filter((c) => c.length > 0),
    ));
    const total = codes.length;

    let by_client: Bucket[] = rankTop(
      offlineRows.map((r) => getStr(r, ["Nome", "nome", "Cliente_Nome", "ClienteNome"]) || getStr(r, ["Codigo", "Cliente"])),
      8,
    );

    if (isDebug) {
      return new Response(
        JSON.stringify({
          ok: true,
          debug: true,
          source: "ConsultaClienteOnline",
          total_rows_returned: allRows.length,
          sample_keys: allRows[0] ? Object.keys(allRows[0]) : [],
          sample_rows: allRows.slice(0, 3),
          offline_sample: offlineRows.slice(0, 3),
          offline_count_detected: total,
        }, null, 2),
        { headers: corsHeaders, status: 200 },
      );
    }

    let by_region: Bucket[] = [];
    let by_olt: Bucket[] = [];
    let by_nas: Bucket[] = [];

    if (total > 0) {
      // Região/nome: cruzar com ConsultaClientes (campos oficiais: Codigo, Nome, Cidade, UF), até 500 códigos por chamada.
      const MAX_PER_CALL = 500;
      const chunks: string[][] = [];
      for (let i = 0; i < codes.length; i += MAX_PER_CALL) chunks.push(codes.slice(i, i + MAX_PER_CALL));
      const clienteMap = new Map<string, { nome: string; cidade: string; uf: string }>();
      await Promise.all(
        chunks.map((chunk) => {
          const idsSql = chunk.map((c) => `'${c.replace(/'/g, "")}'`).join(",");
          return rbxCall(endpoint, cfg.auth_key_v1, "ConsultaClientes", `Codigo IN (${idsSql})`).then((res) => {
            const ok = res?.status === 1 || res?.status === "1" || res?.status === true || Number(res?.erro_code) === 1;
            if (!ok) return;
            const list = extractList(res?.result ?? res);
            for (const r of list) {
              const code = getStr(r, ["Codigo", "codigo"]);
              if (!code) continue;
              clienteMap.set(code, {
                nome: getStr(r, ["Nome", "nome", "RazaoSocial", "Razao_Social"]),
                cidade: getStr(r, ["Cidade", "cidade"]),
                uf: getStr(r, ["UF", "uf", "Estado", "estado"]),
              });
            }
          });
        }),
      );

      const regions: string[] = codes.map((code) => {
        const c = clienteMap.get(code);
        if (!c) return "";
        return c.cidade && c.uf ? `${c.cidade}/${c.uf}` : c.cidade || c.uf || "";
      });

      by_region = rankTop(regions);
      by_client = rankTop(codes.map((code) => clienteMap.get(code)?.nome || getStr(offlineRows.find((r) => getStr(r, ["Codigo", "Cliente"]) === code), ["Nome"]) || `Cliente ${code}`), 8);

      // Dados reais disponíveis no endpoint oficial ConsultaClienteOnline.
      // A documentação retorna NAS conectados; OLT/porta não faz parte desse retorno, então não inferimos.
      const nases = offlineRows.flatMap((r) =>
        getStr(r, ["NasConectados", "NASConectados", "nas_conectados"])
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      );
      by_nas = rankTop(nases);
    }

    const fetched_at = new Date().toISOString();

    // Snapshot histórico (não bloqueia resposta)
    try {
      await supa.from("rbx_offline_snapshots").insert({ total, by_region, by_olt, by_nas });
    } catch (e) {
      console.warn("[rbx-clientes-offline] snapshot insert failed:", (e as Error).message);
    }

    // Variação 1h
    let total_1h_ago: number | null = null;
    let delta_pct: number | null = null;
    let alert = false;
    try {
      const target = new Date(Date.now() - 60 * 60 * 1000);
      const lo = new Date(target.getTime() - 10 * 60 * 1000).toISOString();
      const hi = new Date(target.getTime() + 10 * 60 * 1000).toISOString();
      const { data: hist } = await supa
        .from("rbx_offline_snapshots")
        .select("total, captured_at")
        .gte("captured_at", lo)
        .lte("captured_at", hi)
        .order("captured_at", { ascending: true })
        .limit(1);
      if (hist && hist.length > 0) {
        total_1h_ago = Number(hist[0].total) || 0;
        const base = Math.max(total_1h_ago, 1);
        delta_pct = Math.round(((total - total_1h_ago) / base) * 1000) / 10;
        alert = delta_pct > 5;
      }
    } catch (e) {
      console.warn("[rbx-clientes-offline] history lookup failed:", (e as Error).message);
    }

    const payload = { ok: true, total, by_client, by_region, by_olt, by_nas, total_1h_ago, delta_pct, alert, fetched_at };
    return new Response(JSON.stringify(payload), { headers: corsHeaders, status: 200 });
  } catch (e) {
    console.error("[rbx-clientes-offline] exception:", (e as Error).message);
    return new Response(
      JSON.stringify({ ok: false, error: "exception", message: (e as Error).message }),
      { headers: corsHeaders, status: 200 },
    );
  }
});
