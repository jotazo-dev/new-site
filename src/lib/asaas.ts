import { supabase } from "@/integrations/supabase/client";

export type AsaasMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface AsaasProxyResponse<T = any> {
  ok: boolean;
  status?: number;
  data?: T;
  error?: string;
  environment?: string;
  durationMs?: number;
}

export async function asaasCall<T = any>(opts: {
  path: string;
  method?: AsaasMethod;
  body?: any;
  environment?: "sandbox" | "production";
}): Promise<AsaasProxyResponse<T>> {
  const { data, error } = await supabase.functions.invoke("asaas-proxy", {
    body: {
      path: opts.path,
      method: opts.method || "GET",
      body: opts.body,
      environment: opts.environment,
    },
  });
  if (error) return { ok: false, error: error.message };
  return data as AsaasProxyResponse<T>;
}

export async function asaasTestConnection(opts: {
  environment: "sandbox" | "production";
  apiKey?: string;
}): Promise<{
  ok: boolean;
  message?: string;
  account?: { name?: string; email?: string; walletId?: string; companyType?: string; cpfCnpj?: string };
  balance?: number | null;
  environment?: string;
}> {
  const { data, error } = await supabase.functions.invoke("asaas-test-connection", {
    body: opts,
  });
  if (error) return { ok: false, message: error.message };
  return data;
}

export function asaasWebhookUrl(): string {
  const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/asaas-webhook`;
}
