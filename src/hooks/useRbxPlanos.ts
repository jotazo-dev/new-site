import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RbxPlano = Record<string, unknown> & {
  Codigo?: string | number;
  Descricao?: string;
  Valor?: string | number;
  Situacao?: string;
};

export type RbxPlanosResult = {
  ok: boolean;
  count?: number;
  planos?: RbxPlano[];
  error?: string;
  code?: number;
  message?: string;
  latency_ms?: number;
};

export function useRbxPlanos(filtro: string, enabled = true) {
  return useQuery<RbxPlanosResult>({
    queryKey: ["rbx-planos", filtro],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("rbx-list-planos", {
        body: { filtro },
      });
      if (error) throw error;
      return data as RbxPlanosResult;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
