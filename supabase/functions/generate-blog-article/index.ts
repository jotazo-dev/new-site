import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateAndUploadImage(
  altText: string,
  slug: string,
  index: number,
  apiKey: string,
  supabaseClient: any
): Promise<string | null> {
  try {
    const prompt = `Create a professional, modern, editorial-style photograph for a telecom/technology blog article. The image should represent: "${altText}". Style: clean, high-quality, professional lighting, suitable for a tech/telecom company blog. No text overlays.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error(`Image generation failed for index ${index}:`, response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Extract base64 image from response
    let base64Data: string | null = null;
    if (Array.isArray(content)) {
      const imagePart = content.find((p: any) => p.type === "image_url" || p.type === "image");
      if (imagePart?.image_url?.url) {
        base64Data = imagePart.image_url.url.replace(/^data:image\/\w+;base64,/, "");
      }
    } else if (typeof content === "string") {
      // Try to extract base64 from inline data URI
      const match = content.match(/data:image\/\w+;base64,([A-Za-z0-9+/=]+)/);
      if (match) base64Data = match[1];
    }

    // Also check inline_data format
    if (!base64Data) {
      const parts = data.choices?.[0]?.message?.parts;
      if (Array.isArray(parts)) {
        const imgPart = parts.find((p: any) => p.inline_data);
        if (imgPart?.inline_data?.data) base64Data = imgPart.inline_data.data;
      }
    }

    if (!base64Data) {
      console.error(`No image data in response for index ${index}`);
      return null;
    }

    // Decode base64 to Uint8Array
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const filePath = `inline/jotazo-telecom-${slug}-inline-${index}.png`;

    const { error: uploadError } = await supabaseClient.storage
      .from("blog-images")
      .upload(filePath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload failed for ${filePath}:`, uploadError);
      return null;
    }

    const { data: urlData } = supabaseClient.storage
      .from("blog-images")
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (e) {
    console.error(`Error generating image ${index}:`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { title, instructions, slug } = await req.json();

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Título é obrigatório (mínimo 3 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um redator SEO especialista e redator profissional de blog para a Jotazo Telecom (jotazo.com.br), um provedor de internet fibra óptica, TV, telefonia e 5G no Brasil.

Regras OBRIGATÓRIAS de formato:
- Escreva em português brasileiro, tom profissional mas acessível
- Retorne APENAS HTML puro (sem markdown, sem blocos de código, sem \`\`\`)
- Use tags semânticas: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <blockquote>, <strong>, <em>
- NÃO use <h1> (o título já é exibido separadamente como H1 da página)
- O artigo deve ter entre 800-1200 palavras

FORMATAÇÃO E ESPAÇAMENTO:
- Parágrafos: <p style="margin-bottom:16px;line-height:1.8">
- Títulos: <h2 style="margin-top:32px;margin-bottom:16px;font-size:1.5rem;font-weight:700">
- Subtítulos: <h3 style="margin-top:24px;margin-bottom:12px;font-size:1.25rem;font-weight:600">
- Listas: <ul style="margin-bottom:16px;padding-left:24px;list-style-type:disc"> ou <ol style="margin-bottom:16px;padding-left:24px;list-style-type:decimal">
- Itens de lista: <li style="margin-bottom:8px;line-height:1.7">
- Citações: <blockquote style="margin:24px 0;padding:16px 24px;border-left:4px solid #2563eb;background:#f0f7ff;border-radius:8px;font-style:italic">

TÉCNICAS DE SEO (Search Engine Optimization):
1. HIERARQUIA SEMÂNTICA: Use H2 para seções principais (4-6 seções) e H3 para subtópicos dentro delas.
2. PALAVRA-CHAVE: Identifique a palavra-chave principal do título. Inclua-a naturalmente no PRIMEIRO parágrafo, em pelo menos 2 H2s, e distribuída ao longo do texto (densidade ~1-2%).
3. PRIMEIRO PARÁGRAFO: Comece com uma definição direta ou resposta objetiva ao tema do título.
4. PARÁGRAFOS CURTOS: Máximo 3-4 linhas por parágrafo para escaneabilidade.
5. LISTAS PARA SNIPPETS: Inclua pelo menos 1 lista (<ul> ou <ol>) formatada como guia passo-a-passo ou lista de benefícios.
6. ALT TEXT COM KEYWORDS: Nas imagens, use alt text descritivo que inclua a keyword principal naturalmente.
7. LINKS INTERNOS COM ANCHOR TEXT RELEVANTE: Use texto âncora descritivo (NUNCA "clique aqui"). Exemplos:
   <a href="https://jotazo.com.br/planos" style="color:#2563eb;text-decoration:underline">planos de internet fibra óptica da Jotazo</a>
   <a href="https://jotazo.com.br/cobertura" style="color:#2563eb;text-decoration:underline">verificar cobertura de fibra óptica</a>
   <a href="https://jotazo.com.br" style="color:#2563eb;text-decoration:underline">Jotazo Telecom</a>
   Insira 2-3 backlinks naturais em contextos relevantes.
8. CONCLUSÃO COM CTA: Termine com uma conclusão que incentive o leitor a conhecer os serviços, com link para a página relevante.
9. META DESCRIPTION: No campo "excerpt", escreva uma meta description otimizada (máximo 155 caracteres) que inclua a keyword principal e um CTA implícito.

TÉCNICAS DE GEO (Generative Engine Optimization):
1. DEFINIÇÃO PRIMEIRO: O primeiro parágrafo deve responder diretamente à pergunta implícita do título.
2. DADOS E ESTATÍSTICAS: Inclua pelo menos 2-3 dados estatísticos ou numéricos relevantes do setor de telecomunicações brasileiro.
3. SEÇÃO FAQ: Inclua uma seção com 2-3 perguntas frequentes usando o padrão:
   <h3>Pergunta frequente aqui?</h3>
   <p>Resposta direta e objetiva...</p>
4. LINGUAGEM AUTORITATIVA: Use afirmações claras e verificáveis. Posicione a Jotazo Telecom como autoridade no assunto.
5. CITAÇÕES E FONTES: Quando mencionar dados, cite a fonte (Anatel, IBGE, estudos do setor). Use <strong> para destacar fontes.
6. MENÇÃO À MARCA: Cite "Jotazo Telecom" pelo menos 3x ao longo do artigo de forma natural.

IMAGENS:
- Insira 2-3 imagens inline usando Unsplash com URLs reais:
  <img src="https://images.unsplash.com/photo-XXXXX?w=800&q=80" alt="descrição com keyword" style="width:100%;border-radius:12px;margin:24px 0" />
  Use fotos reais de tecnologia, fibra óptica, redes, internet, cidades brasileiras.

Use <strong> para destacar termos-chave, benefícios e dados importantes.`;

    const userPrompt = `Crie um artigo completo para o blog com o título: "${title.trim()}"${instructions ? `\n\nInstruções adicionais: ${instructions}` : ""}`;

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
              name: "create_blog_article",
              description: "Retorna o artigo completo em HTML otimizado para SEO e GEO, um resumo, tempo de leitura, título SEO e palavras-chave",
              parameters: {
                type: "object",
                properties: {
                  html: {
                    type: "string",
                    description: "O conteúdo HTML completo do artigo (sem h1, sem markdown), otimizado para SEO e GEO",
                  },
                  excerpt: {
                    type: "string",
                    description: "Meta description otimizada para SEO (máximo 155 caracteres, com keyword principal e CTA implícito, texto puro sem HTML)",
                  },
                  readTime: {
                    type: "string",
                    description: "Tempo estimado de leitura em formato '5 min'",
                  },
                  seoTitle: {
                    type: "string",
                    description: "Título otimizado para SEO (máximo 60 caracteres, com keyword principal no início)",
                  },
                  metaKeywords: {
                    type: "string",
                    description: "3-5 palavras-chave relevantes separadas por vírgula",
                  },
                },
                required: ["html", "excerpt", "readTime", "seoTitle", "metaKeywords"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_blog_article" } },
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

    // === Replace Unsplash images with AI-generated images ===
    const articleSlug = slug || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (result.html) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Find all Unsplash img tags
        const imgRegex = /<img\s[^>]*src="https:\/\/images\.unsplash\.com\/[^"]*"[^>]*>/g;
        const altRegex = /alt="([^"]*)"/;
        const matches = [...result.html.matchAll(imgRegex)];

        console.log(`Found ${matches.length} Unsplash images to replace`);

        for (let i = 0; i < matches.length; i++) {
          const imgTag = matches[i][0];
          const altMatch = imgTag.match(altRegex);
          const altText = altMatch?.[1] || title.trim();

          console.log(`Generating image ${i + 1}/${matches.length}: "${altText}"`);

          const publicUrl = await generateAndUploadImage(
            altText,
            articleSlug,
            i + 1,
            LOVABLE_API_KEY,
            supabaseAdmin
          );

          if (publicUrl) {
            // Replace src URL in the original img tag
            const newImgTag = imgTag.replace(/src="https:\/\/images\.unsplash\.com\/[^"]*"/, `src="${publicUrl}"`);
            result.html = result.html.replace(imgTag, newImgTag);
            console.log(`Replaced image ${i + 1} with ${publicUrl}`);
          } else {
            console.warn(`Failed to generate image ${i + 1}, keeping Unsplash URL`);
          }

          // Small delay between generations to avoid rate limiting
          if (i < matches.length - 1) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      } else {
        console.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set, skipping image replacement");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog-article error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
