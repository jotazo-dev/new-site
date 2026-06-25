// Edge Function: rbx-test-invoice-extraction
// Roda cenários de extração (PDF, linha digitável, PIX) validando contra a doc RBX v2.
// Suporta modo "mock" (payloads estáticos) e modo "real" (chama a API RBX configurada).
// Em modo real usa exatamente os mesmos endpoints/payloads do /minhaconta (helper compartilhado).


import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAdmin } from "../_shared/adminGuard.ts";
import {
  loadRbxConfig,
  fetchInvoicePayables,
  okStatus,
  extractBoleto,
  extractBarcode,
  extractPixCopia,
  extractPixQr,
} from "../_shared/rbx.ts";

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return a === b;
  const ak = Object.keys(a), bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (!deepEqual(a[k], b[k])) return false;
  return true;
}

const scenarios = [
  // ---- get_banking_billet ----
  {
    id: "billet.standard",
    service: "get_banking_billet",
    description: "Resposta padrão com banking_billet_link + base64 + available=1",
    mock: { status: 1, result: { banking_billet_link: "https://rbx.example/boleto/12345.pdf", banking_billet_base64: "JVBERi0xLjQKJ...", banking_billet_available: 1 } },
    expected: { pdfUrl: "https://rbx.example/boleto/12345.pdf", pdfBase64: "JVBERi0xLjQKJ...", available: 1 },
    extractor: extractBoleto,
  },
  {
    id: "billet.linkOnly",
    service: "get_banking_billet",
    description: "Apenas link (sem base64) — caso comum da v2",
    mock: { status: 1, result: { banking_billet_link: "https://rbx.example/b.pdf" } },
    expected: { pdfUrl: "https://rbx.example/b.pdf", pdfBase64: null, available: null },
    extractor: extractBoleto,
  },
  {
    id: "billet.error",
    service: "get_banking_billet",
    description: "status=0 deve retornar null (boleto indisponível)",
    mock: { status: 0, error_code: 412, error_description: "Invalid document" },
    expected: null,
    extractor: extractBoleto,
  },

  // ---- get_barcode ----
  {
    id: "barcode.objectBarcode",
    service: "get_barcode",
    description: "result.barcode (campo principal documentado)",
    mock: { status: 1, result: { barcode: "23793.38128 60082.150301 71000.063305 7 99340000019990" } },
    expected: "23793.38128 60082.150301 71000.063305 7 99340000019990",
    extractor: extractBarcode,
  },
  {
    id: "barcode.objectLine",
    service: "get_barcode",
    description: "Variante result.line",
    mock: { status: 1, result: { line: "23793.38128 60082.150301 71000.063305 7 99340000019990" } },
    expected: "23793.38128 60082.150301 71000.063305 7 99340000019990",
    extractor: extractBarcode,
  },
  {
    id: "barcode.objectDigitable",
    service: "get_barcode",
    description: "Variante result.digitable_line",
    mock: { status: 1, result: { digitable_line: "23793.38128 60082.150301 71000.063305 7 99340000019990" } },
    expected: "23793.38128 60082.150301 71000.063305 7 99340000019990",
    extractor: extractBarcode,
  },
  {
    id: "barcode.string",
    service: "get_barcode",
    description: "result como string direta",
    mock: { status: 1, result: "23793.38128 60082.150301 71000.063305 7 99340000019990" },
    expected: "23793.38128 60082.150301 71000.063305 7 99340000019990",
    extractor: extractBarcode,
  },
  {
    id: "barcode.error",
    service: "get_barcode",
    description: "status=0 deve retornar string vazia",
    mock: { status: 0, error_description: "Boleto inválido" },
    expected: "",
    extractor: extractBarcode,
  },

  // ---- get_pix_copia_cola ----
  {
    id: "pix.copiaCola",
    service: "get_pix_copia_cola",
    description: "result.pix_copia_cola (campo principal)",
    mock: { status: 1, result: { pix_copia_cola: "EMV_PAYLOAD" } },
    expected: "EMV_PAYLOAD",
    extractor: extractPixCopia,
  },
  {
    id: "pix.emv",
    service: "get_pix_copia_cola",
    description: "Variante result.emv",
    mock: { status: 1, result: { emv: "EMV_PAYLOAD" } },
    expected: "EMV_PAYLOAD",
    extractor: extractPixCopia,
  },
  {
    id: "pix.string",
    service: "get_pix_copia_cola",
    description: "result como string EMV direta",
    mock: { status: 1, result: "EMV_PAYLOAD" },
    expected: "EMV_PAYLOAD",
    extractor: extractPixCopia,
  },
  {
    id: "pix.error",
    service: "get_pix_copia_cola",
    description: "status=0 → vazio",
    mock: { status: 0 },
    expected: "",
    extractor: extractPixCopia,
  },

  // ---- get_pix_qrcode ----
  {
    id: "qr.qrCode",
    service: "get_pix_qrcode",
    description: "result.qr_code (base64 puro)",
    mock: { status: 1, result: { qr_code: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" } },
    expected: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    extractor: extractPixQr,
  },
  {
    id: "qr.dataUriStripped",
    service: "get_pix_qrcode",
    description: "Deve remover prefixo data:image/png;base64,",
    mock: { status: 1, result: { qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" } },
    expected: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    extractor: extractPixQr,
  },
  {
    id: "qr.imageField",
    service: "get_pix_qrcode",
    description: "Variante result.image",
    mock: { status: 1, result: { image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" } },
    expected: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    extractor: extractPixQr,
  },
  {
    id: "qr.string",
    service: "get_pix_qrcode",
    description: "result como string base64 direta",
    mock: { status: 1, result: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" },
    expected: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    extractor: extractPixQr,
  },
  {
    id: "qr.error",
    service: "get_pix_qrcode",
    description: "status=0 → vazio",
    mock: { status: 0 },
    expected: "",
    extractor: extractPixQr,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const mode = body.mode || "mock";
  const document = body.document; // CPF ou CNPJ

  if (mode === "real") {
    if (!document) {
      return new Response(JSON.stringify({ ok: false, error: "CPF/CNPJ obrigatório para modo real" }), {
        status: 200, headers: corsHeaders
      });
    }
    const cfg = await loadRbxConfig();
    if (!cfg) return new Response(JSON.stringify({ ok: false, error: "Configuração RBX incompleta" }), {
      status: 200, headers: corsHeaders
    });
    if (!cfg.authKeyV2) return new Response(JSON.stringify({ ok: false, error: "Chave v2 não configurada" }), {
      status: 200, headers: corsHeaders
    });

    const v1Endpoint = cfg.endpoint;
    const digits = String(document).replace(/\D/g, "");

    // 1. Busca cliente (v1)
    const v1Res = await fetch(v1Endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ConsultaClientes: {
          Autenticacao: { ChaveIntegracao: cfg.authKey },
          Filtro: `CPF_CNPJ = '${digits}' OR CNPJ_CNPF = '${digits}'`,
        }
      })
    });
    const v1Data = await v1Res.json();
    const cliente = Array.isArray(v1Data?.result) ? v1Data.result[0] : (Array.isArray(v1Data) ? v1Data[0] : null);
    const customerCode = cliente?.Codigo || cliente?.CodigoCliente || cliente?.codigo;

    if (!customerCode) return new Response(JSON.stringify({ ok: false, error: "Cliente não encontrado ou código inválido" }), { status: 200, headers: corsHeaders });

    // 2. Busca faturas em aberto (v1)
    const openRes = await fetch(v1Endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ConsultaDocumentosAbertos: {
          Autenticacao: { ChaveIntegracao: cfg.authKey },
          Filtro: `Cliente = ${customerCode}`,
        }
      })
    });
    const openData = await openRes.json();
    const docs = openData?.result || openData;
    const doc = Array.isArray(docs) ? docs[0] : null;
    const docId = doc?.Documento || doc?.Codigo || doc?.Id || doc?.NossoNumero;
    const dueDate = doc?.Vencimento || doc?.DataVencimento || null;

    if (!docId) return new Response(JSON.stringify({ ok: false, error: "Nenhuma fatura em aberto encontrada" }), { status: 200, headers: corsHeaders });

    // 3. Chama os MESMOS 4 endpoints v2 que o /minhaconta usa (helper compartilhado),
    //    passando os MESMOS payloads (incluindo banking_billet_due_date).
    const payables = await fetchInvoicePayables(
      { endpointV2: cfg.endpointV2, authKeyV2: cfg.authKeyV2 },
      { docId, dueDate },
    );
    const { raw, payloads } = payables;

    const realResults = [
      { id: "real.customer", service: "info", description: "Cliente localizado (v1)", actual: { nome: cliente?.Nome || cliente?.RazaoSocial, codigo: customerCode }, passed: true },
      { id: "real.invoice", service: "info", description: "Fatura em aberto localizada (v1)", actual: { id: docId, vencimento: dueDate }, passed: true },
      { id: "real.billet", service: "get_banking_billet", description: "PDF do boleto (mesma chamada do /minhaconta)", payload: payloads.billet, actual: payables.boleto, raw: raw.billet, passed: okStatus(raw.billet) },
      { id: "real.barcode", service: "get_barcode", description: "Linha digitável (mesma chamada do /minhaconta)", payload: payloads.barcode, actual: payables.barcode, raw: raw.barcode, passed: okStatus(raw.barcode) },
      { id: "real.pixCopia", service: "get_pix_copia_cola", description: "PIX Copia e Cola (mesma chamada do /minhaconta)", payload: payloads.pixCopia, actual: payables.pixCopia, raw: raw.pixCopia, passed: okStatus(raw.pixCopia) },
      { id: "real.pixQrcode", service: "get_pix_qrcode", description: "QR Code PIX (mesma chamada do /minhaconta)", payload: payloads.pixQrcode, actual: payables.pixQrBase64 ? `${payables.pixQrBase64.slice(0, 60)}…` : "", raw: raw.pixQrcode, passed: okStatus(raw.pixQrcode) },
    ];

    return new Response(JSON.stringify({ ok: realResults.every(r => r.passed), mode: "real", results: realResults }), {
      status: 200, headers: corsHeaders
    });
  }

  const results = scenarios.map((s) => {
    let actual: any = undefined;
    let error: string | null = null;
    try {
      actual = s.extractor(s.mock);
    } catch (e) {
      error = (e as Error).message;
    }
    const passed = !error && deepEqual(actual, s.expected);
    return { id: s.id, service: s.service, description: s.description, passed, expected: s.expected, actual, error };
  });

  return new Response(JSON.stringify({
    ok: results.every(r => r.passed),
    mode: "mock",
    summary: { total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length },
    results
  }), {
    status: 200, headers: corsHeaders
  });
});
