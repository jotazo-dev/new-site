import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { cnpj } = await req.json();
    const cleanCnpj = cnpj.replace(/\D/g, "");

    if (cleanCnpj.length !== 14) {
      throw new Error("CNPJ inválido");
    }

    console.log(`[Search-CNPJ] Searching: ${cleanCnpj}`);

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Search-CNPJ] Brasil API Error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ found: false, error: "CNPJ não encontrado ou erro na API" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = await response.json();

    const qsa0 = Array.isArray(data.qsa) && data.qsa.length ? data.qsa[0] : null;
    const representative = qsa0 ? {
      document: String(qsa0.cnpj_cpf_do_socio || "").replace(/\D/g, ""),
      name: qsa0.nome_socio || "",
      role: qsa0.qualificacao_socio || "",
    } : null;

    const phoneDigits = String(data.ddd_telefone_1 || "").replace(/\D/g, "");

    const result = {
      name: data.razao_social || data.nome_fantasia,
      fantasy_name: data.nome_fantasia || null,
      source: "Brasil API",
      birth_date: data.data_inicio_atividade || null,
      found: true,
      birthDate: null,
      docType: "cnpj" as const,
      email: data.email || "",
      phone: phoneDigits,
      representative,
      address: {
        street: data.logradouro,
        number: data.numero,
        neighborhood: data.bairro,
        city: data.municipio,
        state: data.uf,
        zipCode: data.cep
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
