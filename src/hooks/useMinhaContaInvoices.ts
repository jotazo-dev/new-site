import { useCallback, useEffect, useState } from "react";

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const TOKEN_KEY = "minhaconta.token";

export type Invoice = {
  id: string;
  reference: string;
  dueDate: string | null;
  amountCents: number;
  status: "paid" | "open" | "overdue" | "future";
  statusLabel: string;
  barcode?: string;
  pixCode?: string;
  downloadUrl?: string;
  plano?: string;
};

async function call(action: string, extra: Record<string, unknown> = {}) {
  const accessToken = sessionStorage.getItem(TOKEN_KEY);
  const r = await fetch(`${FUNCTIONS_URL}/minhaconta-auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ action, accessToken, ...extra }),
  });
  const data = await r.json().catch(() => null) as any;
  return { ok: r.ok && data?.ok, data, status: r.status };
}

export type InvoiceDetails = {
  invoice: Invoice;
  boleto: { pdfUrl: string | null; pdfBase64: string | null; available: number | null } | null;
  barcode: string | null;
  pix: { copiaCola: string | null; qrCodeBase64: string | null } | null;
  paid?: boolean;
  errors?: { boleto: string | null; barcode: string | null; pix: string | null };
};

export function useInvoiceDetails(invoiceId: string | null) {
  const [data, setData] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!invoiceId) {
      setData(null);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    const { ok, data: res } = await call("invoice-details", { invoiceId });
    
    if (ok) {
      setData(res as InvoiceDetails);
    } else {
      setError(res?.error || "Não foi possível carregar a fatura.");
    }
    setLoading(false);
  }, [invoiceId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { data, loading, error, refetch: fetchDetails };
}


export function useInvoicesList() {
  const [list, setList] = useState<Invoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    const { ok, data } = await call("invoices");
    if (ok) setList(data.list);
    else setError(data?.error || "Não foi possível carregar suas faturas.");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { list, loading, error, refetch: fetchData };
}

export function useSecondCopy() {
  const [latest, setLatest] = useState<Invoice | null>(null);
  const [expired, setExpired] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    const { ok, data } = await call("second-copy");
    if (ok) { setLatest(data.latest || null); setExpired(data.expired || []); }
    else setError(data?.error || "Não foi possível carregar a 2ª via.");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { latest, expired, loading, error, refetch: fetchData };
}
