import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { algarCall, type AlgarSubscriber } from "@/components/admin/esim/algar/algarClient";
import { eaiCall, extractList } from "@/components/admin/esim/eai/eaiClient";

export type KpiBreakdown = { rbx: number; algar: number; eai: number };
export type KpiResult = {
  total: { value: number; bySource: KpiBreakdown };
  mvnoAtivos: { value: number; bySource: { algar: number; eai: number } };
  mvnoMes: { value: number; bySource: { algar: number; eai: number } };
  cancelados: { value: number; bySource: KpiBreakdown };
  cancelados30d: { value: number; bySource: KpiBreakdown };
  chamadosMes: { value: number };
  errors: { rbx?: string; algar?: string; eai?: string; chamados?: string };
};

function monthRangeBR(): { from: string; to: string } {
  const fmt = (d: Date) => {
    const f = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric", month: "2-digit", day: "2-digit",
    });
    return f.format(d);
  };
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: fmt(first), to: fmt(now) };
}

async function fetchChamadosMes(): Promise<number> {
  const { from, to } = monthRangeBR();
  const { data, error } = await supabase.functions.invoke("rbx-list-atendimentos", { body: { from, to } });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Falha RBX atendimentos");
  return Array.isArray(data.atendimentos) ? data.atendimentos.length : 0;
}

function monthStartTs(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function pickCreatedDate(o: any): string | null {
  return (
    o?.created_at ??
    o?.createdAt ??
    o?.activation_date ??
    o?.activationDate ??
    o?.activated_at ??
    o?.activatedAt ??
    o?.dt_ativacao ??
    o?.DataAtivacao ??
    o?.data_ativacao ??
    o?.dt_cadastro ??
    o?.DataCadastro ??
    null
  );
}
function parseTs(d: string | null): number {
  if (!d) return NaN;
  return Date.parse(String(d).length === 10 ? d + "T00:00:00Z" : d);
}
function inCurrentMonth(d: string | null): boolean {
  const t = parseTs(d);
  return Number.isFinite(t) && t >= monthStartTs() && t <= Date.now();
}

const ACTIVE_RE = /^(ativ|active|a|enabled|enable|on|ok)/i;
const CANCEL_RE = /^(cancel|c|disable|disabled|off|inactiv|inativ|baixa|terminate|deactiv)/i;

function pickStatus(o: any): string {
  return String(
    o?.status ?? o?.Status ?? o?.Situacao ?? o?.situacao ?? o?.state ?? o?.estado ?? ""
  );
}
function pickCancelDate(o: any): string | null {
  return (
    o?.canceled_at ??
    o?.cancelled_at ??
    o?.cancellation_date ??
    o?.cancelationDate ??
    o?.deactivated_at ??
    o?.deactivatedAt ??
    o?.dt_cancelamento ??
    o?.DataCancelamento ??
    o?.Cancelamento ??
    o?.Cancelado_em ??
    o?.canceledAt ??
    null
  );
}
function within30d(d: string | null): boolean {
  if (!d) return false;
  const t = Date.parse(String(d).length === 10 ? d + "T00:00:00Z" : d);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= 30 * 24 * 60 * 60 * 1000 && t <= Date.now();
}

async function fetchRbxCounts() {
  const { data, error } = await supabase.functions.invoke("rbx-list-clientes", { body: { filtro: "" } });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.message || "Falha RBX");
  const list: any[] = data.clientes || [];
  let total = 0, cancel = 0, cancel30 = 0, month = 0;
  for (const c of list) {
    const sit = String(c?.Situacao || "").toUpperCase();
    if (sit === "C") {
      cancel++;
      if (within30d(pickCancelDate(c))) cancel30++;
    } else {
      total++;
      if (inCurrentMonth(pickCreatedDate(c))) month++;
    }
  }
  return { total, cancel, cancel30, month };
}

async function fetchPagedAll<T = any>(
  call: (page: number) => Promise<{ items: T[]; totalPages: number }>,
  maxPages = 50,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { items, totalPages: tp } = await call(page);
    all.push(...items);
    totalPages = tp || 1;
    page++;
  } while (page <= totalPages && page <= maxPages);
  return all;
}

async function fetchAlgarCounts() {
  // Paginate /v2/mobilelines to count active/cancelled and current-month activations.
  const items = await fetchPagedAll<any>(async (page) => {
    const res = await algarCall<any>("/v2/mobilelines", { queryParams: { page, size: 100 } });
    if (!res.ok) throw new Error(res.error || "Falha Algar");
    const payload = res.data;
    const arr: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
      ? payload.items
      : [];
    const meta = Array.isArray(payload) ? {} : payload?.meta || {};
    const totalItems = Number(meta.totalItems ?? meta.total ?? meta.count ?? arr.length);
    const totalPages = Number(meta.totalPages || Math.max(1, Math.ceil(totalItems / 100)));
    return { items: arr, totalPages };
  });
  let active = 0, cancel = 0, cancel30 = 0, month = 0;
  for (const it of items) {
    const s = pickStatus(it);
    if (s && CANCEL_RE.test(s)) {
      cancel++;
      if (within30d(pickCancelDate(it))) cancel30++;
    } else {
      active++;
      const created = pickCreatedDate(it) ?? pickCreatedDate(it?.service) ?? pickCreatedDate(it?.service?.subscriber);
      if (inCurrentMonth(created)) month++;
    }
  }
  return { active, cancel, cancel30, month };
}

async function fetchEaiCounts() {
  const items = await fetchPagedAll<any>(async (page) => {
    const res = await eaiCall<any>("/rest/service_eai/customers", {
      query: { "pagination.page": page, "pagination.limit": 100 },
    });
    if (!res.ok) throw new Error(res.error || res.snippet || "Falha EAI");
    const arr = extractList(res) as any[];
    const meta = (res.json as any)?.metadata || (res.json as any)?.pagination || {};
    const total = Number(meta.total ?? meta.totalItems ?? arr.length);
    const totalPages = Math.max(1, Number(meta.totalPages || Math.ceil(total / 100)));
    return { items: arr, totalPages };
  });
  let active = 0, cancel = 0, cancel30 = 0, month = 0;
  for (const it of items) {
    const s = pickStatus(it);
    if (s && CANCEL_RE.test(s)) {
      cancel++;
      if (within30d(pickCancelDate(it))) cancel30++;
    } else {
      active++;
      if (inCurrentMonth(pickCreatedDate(it))) month++;
    }
  }
  return { active, cancel, cancel30, month };
}

export function useAdminClientesKpis(enabled = true) {
  return useQuery<KpiResult>({
    queryKey: ["admin-kpis-clientes"],
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [r, a, e, ch] = await Promise.allSettled([
        fetchRbxCounts(),
        fetchAlgarCounts(),
        fetchEaiCounts(),
        fetchChamadosMes(),
      ]);
      const rbx = r.status === "fulfilled" ? r.value : { total: 0, cancel: 0, cancel30: 0, month: 0 };
      const algar = a.status === "fulfilled" ? a.value : { active: 0, cancel: 0, cancel30: 0, month: 0 };
      const eai = e.status === "fulfilled" ? e.value : { active: 0, cancel: 0, cancel30: 0, month: 0 };
      const chamadosMes = ch.status === "fulfilled" ? ch.value : 0;
      const errors: KpiResult["errors"] = {};
      if (r.status === "rejected") errors.rbx = String((r as any).reason?.message || (r as any).reason);
      if (a.status === "rejected") errors.algar = String((a as any).reason?.message || (a as any).reason);
      if (e.status === "rejected") errors.eai = String((e as any).reason?.message || (e as any).reason);
      if (ch.status === "rejected") errors.chamados = String((ch as any).reason?.message || (ch as any).reason);

      return {
        total: {
          value: rbx.total + algar.active + eai.active,
          bySource: { rbx: rbx.total, algar: algar.active, eai: eai.active },
        },
        mvnoAtivos: {
          value: algar.active + eai.active,
          bySource: { algar: algar.active, eai: eai.active },
        },
        mvnoMes: {
          value: algar.month + eai.month,
          bySource: { algar: algar.month, eai: eai.month },
        },
        cancelados: {
          value: rbx.cancel + algar.cancel + eai.cancel,
          bySource: { rbx: rbx.cancel, algar: algar.cancel, eai: eai.cancel },
        },
        cancelados30d: {
          value: rbx.cancel30 + algar.cancel30 + eai.cancel30,
          bySource: { rbx: rbx.cancel30, algar: algar.cancel30, eai: eai.cancel30 },
        },
        chamadosMes: { value: chamadosMes },
        errors,
      };
    },
  });
}

