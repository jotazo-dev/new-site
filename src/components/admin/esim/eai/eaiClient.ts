import { supabase } from "@/integrations/supabase/client";

export type EaiResult<T = any> = {
  ok: boolean;
  status: number;
  durationMs: number;
  json: T | null;
  snippet: string;
  error?: string;
};

export async function eaiCall<T = any>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    query?: Record<string, unknown>;
  } = {},
): Promise<EaiResult<T>> {
  const { data, error } = await supabase.functions.invoke("eai-proxy", {
    body: {
      action: "tryEndpoint",
      payload: {
        path,
        method: opts.method || "GET",
        body: opts.body,
        query: opts.query,
      },
    },
  });
  if (error) {
    return { ok: false, status: 0, durationMs: 0, json: null, snippet: error.message, error: error.message };
  }
  return data as EaiResult<T>;
}

export function brl(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function gb(mb: number | null | undefined): string {
  if (mb === null || mb === undefined) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
}

export function formatMsisdn(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const d = String(v).replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(v);
}

export function formatCpfCnpj(v: string | null | undefined): string {
  if (!v) return "—";
  const d = String(v).replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return v;
}

export function formatDate(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("pt-BR");
}

export function consumptionPercent(used: number | null | undefined, total: number | null | undefined): number {
  if (!total || !used) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

export function extractList(res: any): any[] {
  const j = res?.json;
  if (!j) return [];
  if (Array.isArray(j)) return j;
  if (Array.isArray(j.data)) return j.data;
  if (Array.isArray(j.results)) return j.results;
  if (Array.isArray(j.items)) return j.items;
  for (const v of Object.values(j)) if (Array.isArray(v)) return v as any[];
  return [];
}

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  const s = String(status).toLowerCase();
  if (/(active|completed|approved|success|ativ|conclu|aprov|sucesso)/.test(s)) return "success";
  if (/(pending|processing|waiting|pendente|aguard|process)/.test(s)) return "warning";
  if (/(error|rejected|failed|cancel|inactive|reject|falh|inativ)/.test(s)) return "danger";
  return "neutral";
}

export function statusClasses(tone: StatusTone): string {
  switch (tone) {
    case "success": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "warning": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "danger": return "bg-destructive/15 text-destructive border-destructive/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}
