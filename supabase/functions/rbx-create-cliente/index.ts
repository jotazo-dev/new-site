// Cria cliente na RBX (v1 ClienteCadastro). Admin-only.
import { requireAdmin } from "../_shared/adminGuard.ts";
import { loadRbxConfig } from "../_shared/rbx.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function onlyDigits(s: string) { return String(s || "").replace(/\D+/g, ""); }
function isoToBr(s?: string): string {
  if (!s) return "";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s);
}

async function rbxPost(endpoint: string, body: any): Promise<any> {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { _raw: t, _status: r.status }; }
  } catch (e) {
    return { _error: (e as Error).message };
  }
}

function extractCodigo(resp: any): string {
  if (!resp) return "";
  const candidates = [
    resp?.result?.Codigo, resp?.result?.codigo, resp?.result?.CodigoCliente,
    resp?.Codigo, resp?.codigo, resp?.CodigoCliente,
    resp?.result?.Cliente?.Codigo, resp?.Cliente?.Codigo,
    resp?.result?.cliente?.codigo, resp?.cliente?.codigo,
    resp?.result?.id, resp?.id,
  ];
  for (const c of candidates) if (c !== undefined && c !== null && String(c).trim() !== "") return String(c);
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await requireAdmin(req);
  if (guard) return guard;
  try {
    const body = await req.json().catch(() => ({}));
    const { name, document, type, email, phone, birthDate, address } = body || {};
    const doc = onlyDigits(document);
    if (!name || (doc.length !== 11 && doc.length !== 14)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_input" }), { status: 400, headers: corsHeaders });
    }
    const cfg = await loadRbxConfig();
    if (!cfg) return new Response(JSON.stringify({ ok: false, error: "rbx_not_configured" }), { status: 500, headers: corsHeaders });

    const a = address || {};
    const isCpf = doc.length === 11;
    const payload: any = {
      ClienteCadastro: {
        Autenticacao: { ChaveIntegracao: cfg.authKey },
        Cliente: {
          Tipo: isCpf ? "F" : "J",
          [isCpf ? "CPF_CNPJ" : "CNPJ_CNPF"]: doc,
          CNPJ_CNPF: doc,
          Nome: name,
          ...(email ? { Email: email } : {}),
          ...(phone ? { Telefone1: onlyDigits(phone), Celular: onlyDigits(phone) } : {}),
          ...(birthDate ? { DataNascimento: isoToBr(birthDate) } : {}),
          ...(a.zipCode ? { CEP: onlyDigits(a.zipCode) } : {}),
          ...(a.street ? { Endereco: a.street } : {}),
          ...(a.number ? { Numero: String(a.number) } : {}),
          ...(a.complement ? { Complemento: a.complement } : {}),
          ...(a.neighborhood ? { Bairro: a.neighborhood } : {}),
          ...(a.city ? { Cidade: a.city } : {}),
          ...(a.state ? { UF: String(a.state).toUpperCase().slice(0, 2) } : {}),
          Pais: "Brasil",
          Situacao: "A",
        },
      },
    };

    const resp = await rbxPost(cfg.endpoint, payload);
    const codigo = extractCodigo(resp?.result ?? resp);
    if (!codigo) {
      return new Response(JSON.stringify({
        ok: false, error: "no_codigo_returned",
        message: resp?.result?.error_description || resp?.error_description || resp?._error || "Resposta sem código",
        raw: resp,
      }), { status: 502, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ ok: true, codigo, raw: resp }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "exception", message: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
