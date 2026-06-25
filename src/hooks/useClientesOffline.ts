import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OfflineBucket = { key: string; count: number };

export type ClientesOfflineResult = {
  ok: boolean;
  total?: number;
  by_client?: OfflineBucket[];
  by_region?: OfflineBucket[];
  by_olt?: OfflineBucket[];
  by_nas?: OfflineBucket[];
  total_1h_ago?: number | null;
  delta_pct?: number | null;
  alert?: boolean;
  fetched_at?: string;
  error?: string;
  message?: string;
};

export function useClientesOffline() {
  return useQuery<ClientesOfflineResult>({
    queryKey: ["clientes-offline"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("rbx-clientes-offline", { body: {} });
      if (error) throw error;
      return data as ClientesOfflineResult;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}
