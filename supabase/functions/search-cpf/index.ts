// Consulta CPF via CPF.CNPJ API (https://www.cpfcnpj.com.br/dev/)
// Pacote 7 (CPF B) por padrão: retorna nome completo + data de nascimento.
// Configure o secret CPFCNPJ_TOKEN. Opcional: CPFCNPJ_PACKAGE (default "7").
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://api.cpfcnpj.com.br";

const ERROR_MAP: Record<number, string> = {
  100: "invalid",
  101: "invalid",
  102: "not_found",
  400: "bad_request",
  1000: "auth",
  1001: "no_credits",
  1002: "auth",
  1003: "blacklist",
  1004: "config",
  1005: "provider",
  1006: "provider",
  1007: "rate_limit",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  const calc = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += parseInt(cpf[i]) * (slice + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(cpf[9]) && calc(10) === parseInt(cpf[10]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { cpf, pacote } = await req.json().catch(() => ({}));
    const digits = String(cpf || "").replace(/\D/g, "");

    if (digits.length !== 11) {
      return json({ found: false, error: "invalid", message: "CPF deve ter 11 dígitos" });
    }
    if (!isValidCpf(digits)) {
      return json({ found: false, error: "invalid", message: "CPF inválido (DV)" });
    }

    const token = Deno.env.get("CPFCNPJ_TOKEN");
    if (!token) {
      console.warn("[search-cpf] CPFCNPJ_TOKEN não configurado");
      return json({
        found: false,
        error: "no_provider",
        message: "Consulta de CPF não configurada (CPFCNPJ_TOKEN ausente).",
      });
    }

    const pkg = String(pacote ?? Deno.env.get("CPFCNPJ_PACKAGE") ?? "7");
    const url = `${BASE}/${token}/${pkg}/${digits}`;
    console.log(`[search-cpf] GET pacote=${pkg} cpf=${digits.slice(0, 3)}***`);

    const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    const text = await r.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch {
      console.error("[search-cpf] resposta não-JSON:", text.slice(0, 200));
      return json({ found: false, error: "provider", message: "Resposta inválida do provedor" });
    }

    if (data?.status !== 1 && data?.status !== true) {
      const code = Number(data?.erroCodigo ?? 0);
      console.warn(`[search-cpf] erro provedor codigo=${code} msg=${data?.erro}`);
      return json({
        found: false,
        error: ERROR_MAP[code] ?? "unknown",
        code,
        message: data?.erro || "Erro ao consultar CPF",
        saldo: data?.saldo,
      });
    }

    // Converter nascimento DD/MM/AAAA -> YYYY-MM-DD
    let birthDate: string | undefined;
    const nasc = String(data.nascimento || "");
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(nasc)) {
      const [d, m, y] = nasc.split("/");
      birthDate = `${y}-${m}-${d}`;
    }

    return json({
      found: true,
      source: `cpfcnpj.com.br pacote ${data.pacoteUsado ?? pkg}`,
      name: data.nome || "",
      // ambos os formatos por compatibilidade com consumidores existentes
      birthDate: birthDate || null,
      birth_date: birthDate || null,
      // campos extras (pacotes superiores)
      motherName: data.mae || null,
      gender: data.genero || null,
      situation: data.situacao || null,
      address: data.endereco
        ? {
            street: data.endereco || null,
            number: data.numero || null,
            complement: data.complemento || null,
            neighborhood: data.bairro || null,
            zipCode: data.cep || null,
            city: data.cidade || null,
            state: data.uf || null,
          }
        : null,
      // metadados de auditoria
      pacoteUsado: data.pacoteUsado,
      saldo: data.saldo,
      consultaID: data.consultaID,
      delay: data.delay,
    });
  } catch (error: any) {
    console.error("[search-cpf] exception:", error?.message || error);
    return json(
      { found: false, error: "exception", message: String(error?.message || error) },
      500,
    );
  }
});
