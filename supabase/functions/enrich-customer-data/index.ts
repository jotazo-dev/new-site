import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { document } = await req.json();
    const cleanDoc = document.replace(/\D/g, "");

    console.log(`[Enrich] Searching data for: ${cleanDoc}`);

    let result = {
      name: "",
      source: "none",
      found: false,
      address: null as any
    };

    // 1. If it's CNPJ, try Brasil API (Free/Official)
    if (cleanDoc.length === 14) {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`);
        if (response.ok) {
          const data = await response.json();
          result = {
            name: data.razao_social || data.nome_fantasia,
            source: "Brasil API (CNPJ)",
            found: true,
            address: {
              street: data.logradouro,
              number: data.numero,
              neighborhood: data.bairro,
              city: data.municipio,
              state: data.uf,
              zipCode: data.cep
            }
          };
        }
      } catch (e) {
        console.error("[Enrich] Brasil API Error:", e.message);
      }
    }

    // 2. Try Brasil API for CPF (Limited but official)
    // Note: Brasil API doesn't have a direct public CPF endpoint like CNPJ, 
    // but we can add other providers here if available.
    if (!result.found && cleanDoc.length === 11) {
      try {
        // As a fallback for public APIs, we could use other services.
        // For now, let's allow it to return not found if not a mock.
        console.log(`[Enrich] CPF ${cleanDoc} lookup requested`);
      } catch (e) {
        console.error("[Enrich] CPF Lookup Error:", e.message);
      }
    }

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
