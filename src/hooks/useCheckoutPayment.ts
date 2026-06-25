import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CheckoutCreatePayload = {
  items: { id: string; name: string; qty: number; unit_cents: number; category?: string }[];
  total_cents: number;
  customer: any;
  method: "credit" | "debit" | "pix" | "boleto";
  installments?: number;
  card?: { number: string; holder: string; expiration: string; cvv: string; brand?: string };
  boletoDueDays?: number;
  returnUrl?: string;
  // Line provisioning (mobile lines only)
  sim_kind?: "esim" | "physical";
  customer_birthdate?: string;
  desired_msisdn_prefix?: string;
  portability?: {
    enabled: true;
    current_msisdn: string;
    current_operator: string;
    current_doc?: string;
    window_id?: string;
  };
  shipping_address?: Record<string, unknown>;
};

export type ProviderAttempt = { provider: string; ok: boolean; http: number; status: string; error: string | null; ts: string };

export type CheckoutCreateResult = {
  ok?: boolean;
  orderId?: string;
  status?: string;
  /** @deprecated use providerStatus */
  cieloStatus?: number;
  provider?: "cielo" | "mercadopago" | "asaas";
  providerStatus?: string | number;
  paymentId?: string;
  method?: string;
  attempts?: ProviderAttempt[];
  pix?: { qrBase64?: string; qrString?: string; expiresAt?: string };
  boleto?: { url?: string; digitableLine?: string; barCode?: string; dueDate?: string };
  card?: { authorizationCode?: string; proofOfSale?: string; authenticationUrl?: string };
  error?: string;
  detail?: unknown;
};

export async function createCheckoutPayment(payload: CheckoutCreatePayload): Promise<CheckoutCreateResult> {
  const { data, error } = await supabase.functions.invoke("checkout-create-payment", { body: payload });
  if (error) return { error: error.message };
  return data as CheckoutCreateResult;
}

/** Polls the edge function via direct fetch for orderId every `intervalMs` until status is terminal. */
export function useOrderStatusPolling(orderId: string | null, options?: { intervalMs?: number; enabled?: boolean }) {
  const [status, setStatus] = useState<string | null>(null);
  const [cieloStatus, setCieloStatus] = useState<number | null>(null);
  const stopRef = useRef(false);
  useEffect(() => {
    if (!orderId || options?.enabled === false) return;
    stopRef.current = false;
    const interval = options?.intervalMs ?? 5000;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (stopRef.current) return;
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const url = `https://${projectId}.supabase.co/functions/v1/checkout-poll-status?orderId=${encodeURIComponent(orderId)}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        const json = await res.json();
        if (!stopRef.current) {
          if (json?.status) setStatus(json.status);
          if (typeof json?.cieloStatus === "number") setCieloStatus(json.cieloStatus);
          const terminal = ["paid", "failed", "canceled", "refunded", "expired"];
          if (json?.status && terminal.includes(json.status)) return;
        }
      } catch { /* keep polling */ }
      if (!stopRef.current) timer = setTimeout(tick, interval);
    };
    timer = setTimeout(tick, interval);
    return () => { stopRef.current = true; clearTimeout(timer); };
  }, [orderId, options?.enabled, options?.intervalMs]);

  return { status, cieloStatus };
}
