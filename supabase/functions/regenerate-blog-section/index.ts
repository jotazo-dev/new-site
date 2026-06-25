import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { selectedHtml, instructions, articleTitle } = await req.json();

    if (!selectedHtml || typeof selectedHtml !== "string" || selectedHtml.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Texto selecionado é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um redator profissional de blog para a Jotazo Telecom (jotazo.com.br), um provedor de internet fibra óptica, TV, telefonia e 5G no Brasil.

Sua tarefa é REESCREVER/REGENERAR um trecho selecionado de um artigo de blog.

Regras OBRIGATÓRIAS:
- Escreva em português brasileiro, tom profissional mas acessível
- Retorne APENAS o HTML do trecho reescrito (sem markdown, sem blocos de código, sem \`\`\`)
- Mantenha o mesmo tipo de estrutura (se era um parágrafo, retorne parágrafos; se era uma seção com h2, retorne com h2)
- Use tags semânticas: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <blockquote>, <strong>, <em>
- Adicione espaçamento adequado entre parágrafos e seções
- Se aplicável, inclua backlinks naturais para https://jotazo.com.br como:
  <a href="https://jotazo.com.br/planos">conheça nossos planos</a>
  <a href="https://jotazo.com.br/cobertura">verifique a cobertura</a>
- O texto reescrito deve ser melhor, mais completo e mais envolvente que o original
- Mantenha o contexto do artigo original`;

    const userPrompt = `Artigo: "${articleTitle || "Sem título"}"

Trecho selecionado para reescrever:
${selectedHtml}

${instructions ? `Instruções: ${instructions}` : "Reescreva melhorando a qualidade, clareza e engajamento."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rewrite_section",
              description: "Retorna o HTML reescrito do trecho selecionado",
              parameters: {
                type: "object",
                properties: {
                  html: {
                    type: "string",
                    description: "O HTML reescrito do trecho (sem h1, sem markdown, apenas HTML semântico formatado)",
                  },
                },
                required: ["html"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rewrite_section" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("Resposta inesperada da IA");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-blog-section error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
