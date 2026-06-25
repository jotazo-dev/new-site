import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VendaRow = {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  installments: number | null;
  total_cents: number;
  subtotal_cents: number;
  discount_cents: number | null;
  customer: any;
  customer_email: string | null;
  customer_doc: string | null;
  items: any;
  cielo_payment_id: string | null;
  cielo_proof_of_sale: string | null;
  cielo_auth_code: string | null;
  card_brand: string | null;
  card_last4: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  provisioning_status: string | null;
  provisioning_attempts: number | null;
  provisioning_last_error: string | null;
  provisioned_at: string | null;
  paid_at?: string | null;
  pix_qr_string: string | null;
  pix_qr_code: string | null;
  pix_expires_at: string | null;
  boleto_url: string | null;
  boleto_digitable_line: string | null;
  boleto_bar_code: string | null;
  boleto_due_date: string | null;
  sim_kind: string | null;
  msisdn: string | null;
  iccid: string | null;
  esim_qr_url: string | null;
  esim_activation_code: string | null;
  tracking_code: string | null;
  shipping_address: any;
  portability: any;
  algar_subscriber_id: string | null;
  algar_service_id: string | null;
  algar_mobileline_id: string | null;
  last_error: any;
  raw_response: any;
  merchant_order_id: string | null;
};

export type VendasFilters = {
  search: string;
  status: string[];
  method: string[];
  provisioning: string[];
  rangePreset: "today" | "7d" | "30d" | "all" | "custom";
  customFrom?: string;
  customTo?: string;
  onlyErrors: boolean;
};

export const DEFAULT_FILTERS: VendasFilters = {
  search: "",
  status: [],
  method: [],
  provisioning: [],
  rangePreset: "30d",
  onlyErrors: false,
};

function rangeBounds(f: VendasFilters): { from?: string; to?: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (f.rangePreset === "today") return { from: startOfDay.toISOString() };
  if (f.rangePreset === "7d") {
    const d = new Date(startOfDay); d.setDate(d.getDate() - 6);
    return { from: d.toISOString() };
  }
  if (f.rangePreset === "30d") {
    const d = new Date(startOfDay); d.setDate(d.getDate() - 29);
    return { from: d.toISOString() };
  }
  if (f.rangePreset === "custom") {
    return { from: f.customFrom, to: f.customTo };
  }
  return {};
}

const PAGE_SIZE = 50;

export function useVendas(initial?: Partial<VendasFilters>) {
  const [filters, setFilters] = useState<VendasFilters>({ ...DEFAULT_FILTERS, ...(initial || {}) });
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<VendaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const bounds = rangeBounds(filters);
      let q = supabase
        .from("checkout_orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (filters.status.length) q = q.in("status", filters.status as any);
      if (filters.method.length) q = q.in("payment_method", filters.method);
      if (filters.provisioning.length) q = q.in("provisioning_status", filters.provisioning as any);
      if (bounds.from) q = q.gte("created_at", bounds.from);
      if (bounds.to) q = q.lte("created_at", bounds.to);

      if (filters.search.trim()) {
        const s = filters.search.trim();
        // Postgrest OR with ilike on multiple fields
        q = q.or(
          [
            `customer_email.ilike.%${s}%`,
            `cielo_payment_id.ilike.%${s}%`,
            `merchant_order_id.ilike.%${s}%`,
            `msisdn.ilike.%${s}%`,
            `customer_doc.ilike.%${s}%`,
            `id.eq.${isUuid(s) ? s : "00000000-0000-0000-0000-000000000000"}`,
          ].join(",")
        );
      }
      if (filters.onlyErrors) {
        q = q.or(`provisioning_status.eq.failed,status.eq.failed`);
      }

      const { data, count, error } = await q;
      if (cancelled) return;
      if (!error) {
        let list = (data ?? []) as VendaRow[];
        // Client-side name search fallback (customer.name is jsonb)
        if (filters.search.trim()) {
          const s = filters.search.trim().toLowerCase();
          const fromServer = list;
          // If server returned 0 results, do a broader name fetch
          if (fromServer.length === 0) {
            const broad = await supabase
              .from("checkout_orders")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(200);
            list = ((broad.data ?? []) as VendaRow[]).filter((o) => {
              const name = (o.customer?.name || "").toLowerCase();
              const phone = (o.customer?.phone || "").toLowerCase();
              return name.includes(s) || phone.includes(s);
            });
            setTotal(list.length);
            setRows(list);
            setLoading(false);
            return;
          }
        }
        setRows(list);
        setTotal(count ?? list.length);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [filters, page, refreshTick]);

  const setFiltersAndReset = useCallback((f: Partial<VendasFilters>) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, ...f }));
  }, []);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return {
    rows, total, loading, filters,
    setFilters: setFiltersAndReset,
    page, setPage, pageCount, pageSize: PAGE_SIZE,
    reload,
  };
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
