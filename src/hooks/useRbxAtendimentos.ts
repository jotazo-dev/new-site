import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AtendimentoStatus = "aberto" | "em_andamento" | "concluido" | "cancelado";

export type Atendimento = {
  id: string;
  protocol: string;
  customerCode?: string;
  customerName: string;
  customerPhone?: string;
  customerPhone2?: string;
  customerEmail?: string;
  customerDocument?: string;
  address?: string;
  city?: string;
  type: string;
  reason?: string;
  description?: string;
  technician?: string;
  status: AtendimentoStatus;
  statusLabel: string;
  scheduledAt: string | null;
  openedAt: string | null;
};

export function useRbxAtendimentos(from: string, to: string, opts?: { enrich?: boolean }) {
  const enrich = opts?.enrich !== false;
  return useQuery({
    queryKey: ["rbx-atendimentos", from, to, enrich],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("rbx-list-atendimentos", {
        body: { from, to, enrich },
      });
      if (error) throw new Error(error.message || "Falha ao buscar atendimentos");
      const payload = data as { ok: boolean; atendimentos?: Atendimento[]; error?: string };
      if (!payload?.ok) throw new Error(payload?.error || "Erro RBX");
      return payload.atendimentos || [];
    },
    staleTime: 60_000,
    retry: 1,
  });
}
