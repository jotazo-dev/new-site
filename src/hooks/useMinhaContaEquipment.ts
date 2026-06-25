import { useCallback, useEffect, useState } from "react";

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const TOKEN_KEY = "minhaconta.token";

export type Equipment = {
  clienteNome: string;
  contratoNumero: string;
  contratoDescricao: string;
  ultimaColeta: string;
  nasIp: string;
  nasSigla: string;
  nasDescricao: string;
  nasSlot: string;
  nasPorta: string;
  equipamentoId: string;
  equipamentoDescricao: string;
  equipamentoSerial: string;
  sinal: number | null;
  ccq: number | null;
  maxCpe: number | null;
  temperatura: number | null;
  tempoConectadoMinutos: number | null;
};

export type Authentication = {
  id: string;
  contrato: string;
  nas: string;
  porta: string;
  usuario: string;
  mac: string;
  observacao: string;
};

export function useMinhaContaEquipment() {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [authentications, setAuthentications] = useState<Authentication[]>([]);
  const [lastFetchedAt, setLastFetchedAt] = useState(0);

  const fetchEquipment = useCallback(async (force = false) => {
    // Debounce manual refresh: 3s
    if (!force && Date.now() - lastFetchedAt < 3000) return;

    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError("Sessão expirada");
      setLoading(false);
      setLoaded(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${FUNCTIONS_URL}/minhaconta-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ action: "equipment", accessToken: token }),
      });
      const data = await r.json().catch(() => null) as any;
      if (!r.ok || !data?.ok) {
        setError(data?.error || "Não foi possível consultar o equipamento.");
        setOnline(false);
        setEquipments([]);
        setAuthentications([]);
      } else {
        setOnline(!!data.online);
        setEquipments(Array.isArray(data.equipments) ? data.equipments : []);
        setAuthentications(Array.isArray(data.authentications) ? data.authentications : []);
      }
    } catch (e: any) {
      setError(e?.message || "Erro de rede");
    } finally {
      setLoading(false);
      setLoaded(true);
      setLastFetchedAt(Date.now());
    }
  }, [lastFetchedAt]);

  useEffect(() => { fetchEquipment(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return { loading, loaded, error, online, equipments, authentications, refetch: () => fetchEquipment(false) };
}
