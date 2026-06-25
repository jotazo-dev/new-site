import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestRequest {
  provider: string;
  config: Record<string, string>;
}

const PROVIDER_TESTS: Record<string, (config: Record<string, string>) => Promise<{ ok: boolean; message: string }>> = {
  webhook: async (config) => {
    const url = config.url || config.webhook_url || config.endpoint;
    if (!url) return { ok: false, message: "Nenhuma URL de webhook configurada." };
    try {
      new URL(url);
    } catch {
      return { ok: false, message: `URL inválida: ${url}` };
    }
    try {
      const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      return { ok: res.status < 500, message: `Webhook respondeu com status ${res.status}.` };
    } catch (e) {
      return { ok: false, message: `Falha ao conectar: ${(e as Error).message}` };
    }
  },

  whatsapp_business: async (config) => {
    const token = config.access_token || config.token || config.api_key;
    const phoneId = config.phone_number_id || config.phone_id;
    if (!token) return { ok: false, message: "Token de acesso não configurado." };
    if (!phoneId) return { ok: false, message: "Phone Number ID não configurado." };
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?access_token=${token}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true, message: "Conexão com WhatsApp Business API válida!" };
      const data = await res.json().catch(() => ({}));
      return { ok: false, message: data?.error?.message || `Erro ${res.status}` };
    } catch (e) {
      return { ok: false, message: `Falha ao conectar: ${(e as Error).message}` };
    }
  },

  email_marketing: async (config) => {
    const apiKey = config.api_key || config.token || config.access_token;
    const baseUrl = config.base_url || config.url || config.endpoint;
    if (!apiKey) return { ok: false, message: "Chave de API não configurada." };
    if (!baseUrl) return { ok: true, message: "Chave de API presente. URL base não fornecida para teste completo." };
    try {
      const res = await fetch(baseUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      return { ok: res.status < 400, message: `API respondeu com status ${res.status}.` };
    } catch (e) {
      return { ok: false, message: `Falha ao conectar: ${(e as Error).message}` };
    }
  },
};

async function genericTest(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const url = config.url || config.base_url || config.endpoint || config.webhook_url;
  const apiKey = config.api_key || config.token || config.access_token || config.secret;

  if (!url && !apiKey) {
    return { ok: false, message: "Nenhum campo de URL ou chave de API encontrado para teste." };
  }

  if (url) {
    try {
      new URL(url);
    } catch {
      return { ok: false, message: `URL inválida: ${url}` };
    }
    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const res = await fetch(url, { method: "HEAD", headers, signal: AbortSignal.timeout(8000) });
      return { ok: res.status < 500, message: `Endpoint respondeu com status ${res.status}.` };
    } catch (e) {
      return { ok: false, message: `Falha ao conectar: ${(e as Error).message}` };
    }
  }

  return { ok: true, message: "Chave de API presente. Sem endpoint para validação completa." };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const body: TestRequest = await req.json();
    const { provider, config } = body;

    if (!provider || !config) {
      return new Response(JSON.stringify({ ok: false, message: "Provedor e configuração são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const testFn = PROVIDER_TESTS[provider] || genericTest;
    const result = await testFn(config);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, message: `Erro interno: ${(e as Error).message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
