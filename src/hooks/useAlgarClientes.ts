import { useQuery } from "@tanstack/react-query";
import { algarCall, findSubscriberByDocument, type AlgarSubscriber } from "@/components/admin/esim/algar/algarClient";

export type AlgarClientesResponse = {
  ok: boolean;
  items: AlgarSubscriber[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  latency_ms?: number;
  error?: string;
  message?: string;
};

function unwrap(data: any): AlgarSubscriber[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export function useAlgarClientes(page: number, size: number = 50, search: string = "") {
  return useQuery<AlgarClientesResponse>({
    queryKey: ["algar-clientes", page, size, search],
    queryFn: async () => {
      const started = Date.now();
      const digits = search.replace(/\D/g, "");

      // Search by document → /v2/subscribers/document/{document}
      if (digits.length === 11 || digits.length === 14) {
        const res = await algarCall<any>(`/v2/subscribers/document/${digits}`);
        const latency_ms = Date.now() - started;
        if (!res.ok) {
          return {
            ok: false, items: [], page: 1, size, totalItems: 0, totalPages: 1,
            latency_ms, error: res.error || "Erro", message: (res as any)?.data?.message,
          };
        }
        const sub = (res.data?.data ?? res.data) as AlgarSubscriber;
        const items = sub ? [sub] : [];
        return { ok: true, items, page: 1, size, totalItems: items.length, totalPages: 1, latency_ms };
      }

      const queryParams: Record<string, any> = { page, size };
      if (search.trim()) queryParams.name = search.trim();

      const res = await algarCall<any>("/v2/subscribers", { queryParams });
      const latency_ms = Date.now() - started;
      if (!res.ok) {
        return {
          ok: false, items: [], page, size, totalItems: 0, totalPages: 1,
          latency_ms, error: res.error || "Erro", message: (res as any)?.data?.message,
        };
      }
      const payload = res.data?.data ?? res.data;
      const items = unwrap(payload);
      const meta = res.data?.meta || payload?.meta || {};
      const totalItems = Number(meta.totalItems ?? meta.total ?? meta.count ?? items.length);
      const totalPages = Number(meta.totalPages || (totalItems ? Math.ceil(totalItems / size) : 1));

      // Enrich rows with mobilelines snapshot (email, phone, address) — list endpoint
      // returns only minimal fields. findSubscriberByDocument reads from a cached
      // /v2/mobilelines index shared across the session.
      const enriched = await Promise.all(
        items.map(async (it) => {
          const doc = String(it.document || it.cpf || it.cnpj || "").replace(/\D/g, "");
          if (!doc) return it;
          try {
            const extra = await findSubscriberByDocument(doc);
            if (!extra) return it;
            return {
              ...extra,
              ...it,
              email: it.email || (extra as any).email,
              contact_number: (it as any).contact_number || (extra as any).contact_number,
              contactPhone: (it as any).contactPhone || (extra as any).contactPhone,
              address: { ...(extra as any).address, ...((it as any).address || {}) },
            } as AlgarSubscriber;
          } catch {
            return it;
          }
        })
      );

      return { ok: true, items: enriched, page, size, totalItems, totalPages, latency_ms };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
