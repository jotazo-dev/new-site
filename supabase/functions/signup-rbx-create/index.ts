// Cria cliente no RBX após signup do site. Requer JWT autenticado (usuário recém-criado).
// Após criar no RBX, grava rbx_code em customer_profiles para vincular conta site ↔ RBX.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

function extractCodigo(resp: any): string {
  if (!resp) return "";
  const candidates = [
    resp?.result?.Codigo, resp?.result?.codigo, resp?.result?.CodigoCliente,
    resp?.Codigo, resp?.codigo, resp?.CodigoCliente,
    resp?.result?.Cliente?.Codigo, resp?.Cliente?.Codigo,
    resp?.result?.id, resp?.id,
  ];
  for (const c of candidates) if (c !== undefined && c !== null && String(c).trim() !== "") return String(c);
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Validar JWT do usuário (qualquer usuário autenticado — não exige admin)
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "unauthenticated" }), { status: 401, headers: corsHeaders });
    }
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supaSrv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supaUrl, supaAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "unauthenticated" }), { status: 401, headers: corsHeaders });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { name, document, email, phone, birthDate, address } = body || {};
    const doc = onlyDigits(document);
    if (!name || (doc.length !== 11 && doc.length !== 14)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_input" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(supaUrl, supaSrv);

    // Idempotência: se já existe rbx_code no profile, retorna ele
    const { data: prof } = await admin.from("customer_profiles").select("rbx_code").eq("user_id", userId).maybeSingle();
    if (prof?.rbx_code) {
      return new Response(JSON.stringify({ ok: true, codigo: prof.rbx_code, reused: true }), { headers: corsHeaders });
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

    const r = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
    const txt = await r.text();
    let resp: any; try { resp = JSON.parse(txt); } catch { resp = { _raw: txt }; }

    const codigo = extractCodigo(resp?.result ?? resp);
    if (!codigo) {
      return new Response(JSON.stringify({
        ok: false, error: "no_codigo_returned",
        message: resp?.result?.error_description || resp?.error_description || "Resposta sem código",
      }), { status: 502, headers: corsHeaders });
    }

    // Vincula no profile (best-effort)
    await admin.from("customer_profiles").update({
      rbx_code: codigo,
      rbx_linked_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return new Response(JSON.stringify({ ok: true, codigo }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "exception", message: (e as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
