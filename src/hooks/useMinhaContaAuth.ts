import { useCallback, useEffect, useState } from "react";

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const TOKEN_KEY = "minhaconta.token";

export type AuthOption = { id: string; email: string; phone: string };
export type AuthCustomer = {
  name: string;
  documentMasked: string;
  code: string;
  email: string;
  phone: string;
  situacao: string;
  endereco: string;
};

async function call(action: string, body: Record<string, unknown>) {
  const r = await fetch(`${FUNCTIONS_URL}/minhaconta-auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await r.json().catch(() => null) as any;
  return { ok: r.ok, status: r.status, data };
}

export function useMinhaContaAuth() {
  const [customer, setCustomer] = useState<AuthCustomer | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) { 
      setBootLoading(false); 
      return; 
    }
    
    call("me", { accessToken: token })
      .then(({ ok, data }) => {
        if (ok && data?.ok) {
          setCustomer(data.customer);
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch((err) => {
        console.error("[MinhaConta] Auth boot error:", err);
        sessionStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        setBootLoading(false);
      });
  }, []);

  const lookup = useCallback(async (document: string) => {
    const { data } = await call("lookup", { document });
    if (!data?.ok) throw new Error(data?.error || "Falha na consulta");
    return { sessionId: data.sessionId as string, options: data.options as AuthOption[] };
  }, []);

  // Confirma o desafio mas NÃO loga o usuário ainda — devolve customer + token
  // para que a página exiba a tela de revisão antes do "Sim, sou eu".
  const confirm = useCallback(async (sessionId: string, selectedOptionId: string) => {
    const { data } = await call("confirm", { sessionId, selectedOptionId });
    if (!data?.ok) {
      const err = new Error(data?.error || "Falha na confirmação");
      (err as any).attemptsLeft = data?.attemptsLeft;
      throw err;
    }
    return {
      customer: data.customer as AuthCustomer,
      accessToken: data.accessToken as string,
    };
  }, []);

  const commit = useCallback((accessToken: string, c: AuthCustomer) => {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    setCustomer(c);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setCustomer(null);
  }, []);

  return { customer, bootLoading, lookup, confirm, commit, logout };
}
