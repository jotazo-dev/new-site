import { useQuery } from "@tanstack/react-query";
import type { Atendimento } from "./useRbxAtendimentos";

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function verifyAgendaPassword(pass: string): Promise<boolean> {
  // Faz uma chamada com range mínimo só para validar a senha.
  const today = new Date().toISOString().slice(0, 10);
  const r = await fetch(`${FUNCTIONS_URL}/rbx-agenda-public`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agenda-pass": pass,
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ from: today, to: today }),
  });
  if (r.status === 401) return false;
  return r.ok || r.status === 502; // 502 = senha ok mas RBX falhou — ainda valida senha
}

export function useRbxAgendaPublic(from: string, to: string, password: string | null) {
  return useQuery({
    queryKey: ["rbx-agenda-public", from, to],
    enabled: !!password,
    queryFn: async () => {
      const r = await fetch(`${FUNCTIONS_URL}/rbx-agenda-public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agenda-pass": password!,
          "apikey": ANON_KEY,
          "Authorization": `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ from, to }),
      });
      const payload = await r.json().catch(() => null) as
        | { ok: boolean; atendimentos?: Atendimento[]; error?: string } | null;
      if (r.status === 401) {
        const err = new Error("Senha inválida");
        (err as Error & { code?: string }).code = "AUTH";
        throw err;
      }
      if (!payload?.ok) throw new Error(payload?.error || `Erro RBX (HTTP ${r.status})`);
      return payload.atendimentos || [];
    },
    staleTime: 60_000,
    refetchInterval: 90_000, // auto-refresh
    retry: (count, err) => {
      if ((err as Error & { code?: string }).code === "AUTH") return false;
      return count < 1;
    },
  });
}
