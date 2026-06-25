import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RbxCliente = Record<string, unknown> & {
  Codigo?: string | number;
  Tipo?: string;
  CNPJ_CNPF?: string;
  Nome?: string;
  Cidade?: string;
  UF?: string;
  TelCelular?: string;
  TelComercial?: string;
  TelResidencial?: string;
  Email?: string;
  Situacao?: string;
  Inclusao?: string;
};

export type RbxClientesResult = {
  ok: boolean;
  count?: number;
  clientes?: RbxCliente[];
  error?: string;
  code?: number;
  message?: string;
  latency_ms?: number;
};

export function useRbxClientes(filtro: string, enabled = true) {
  return useQuery<RbxClientesResult>({
    queryKey: ["rbx-clientes", filtro],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("rbx-list-clientes", {
        body: { filtro },
      });
      if (error) throw error;
      return data as RbxClientesResult;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
