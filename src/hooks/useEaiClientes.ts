import { useQuery } from "@tanstack/react-query";
import { eaiCall, extractList } from "@/components/admin/esim/eai/eaiClient";

export type EaiCustomer = {
  id?: string;
  name?: string;
  legalName?: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  status?: string;
  type?: string;
  typeTelecom?: string;
  addresses?: any[];
  contacts?: any[];
  [k: string]: any;
};

export type EaiClientesResponse = {
  ok: boolean;
  items: EaiCustomer[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  latency_ms?: number;
  error?: string;
};

export function useEaiClientes(page: number, size: number = 50) {
  return useQuery<EaiClientesResponse>({
    queryKey: ["eai-clientes", page, size],
    queryFn: async () => {
      const started = Date.now();
      const res = await eaiCall<any>("/rest/service_eai/customers", {
        query: { "pagination.page": page, "pagination.limit": size },
      });
      const latency_ms = Date.now() - started;
      if (!res.ok) {
        return {
          ok: false, items: [], page, size, totalItems: 0, totalPages: 1,
          latency_ms, error: res.error || res.snippet || "Erro",
        };
      }
      const items = extractList(res) as EaiCustomer[];
      const j: any = res.json || {};
      const meta = j.metadata || j.pagination || j.meta || {};
      const totalItems = Number(
        meta.total ?? meta.totalItems ?? meta.totalRows ?? meta.count ?? items.length
      );
      const totalPages = Math.max(1, Number(meta.totalPages || Math.ceil(totalItems / size)));
      return { ok: true, items, page, size, totalItems, totalPages, latency_ms };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
