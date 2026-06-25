// Shared RBX integration helpers used by minhaconta-auth and rbx-test-invoice-extraction.
// Single source of truth for v1/v2 endpoints, auth, extractors and the invoice payables fetch.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// =====================================================================
// Config
// =====================================================================
export type RbxConfig = {
  endpoint: string;     // v1
  endpointV2: string;   // v2
  authKey: string;      // v1
  authKeyV2?: string;   // v2
};

export async function loadRbxConfig(): Promise<RbxConfig | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supa = createClient(supabaseUrl, supabaseServiceKey);
  const { data: cfg } = await supa
    .from("rbx_config")
    .select("base_url, auth_key_v1, auth_key_v2")
    .limit(1)
    .maybeSingle();
  if (!cfg?.base_url || !cfg.auth_key_v1) return null;
  const base = cfg.base_url.replace(/\/+$/, "");
  return {
    endpoint: `${base}/routerbox/ws/rbx_server_json.php`,
    endpointV2: `${base}/routerbox/ws_json/ws_json.php`,
    authKey: cfg.auth_key_v1,
    authKeyV2: cfg.auth_key_v2 || undefined,
  };
}

// =====================================================================
// HTTP — v1 (legacy JSON)
// =====================================================================
export async function rbxFetchV1(endpoint: string, authKey: string, service: string, filtro: string): Promise<any> {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        [service]: {
          Autenticacao: { ChaveIntegracao: authKey },
          Filtro: filtro,
        },
      }),
      signal: AbortSignal.timeout(20000),
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return null; }
  } catch (e) {
    console.error(`rbxFetchV1 error on "${service}":`, (e as Error).message);
    return null;
  }
}

// =====================================================================
// HTTP — v2 (ws_json)
// =====================================================================
export async function rbxFetchV2(endpoint: string, authKeyV2: string, service: string, payload: object): Promise<any> {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "authentication_key": authKeyV2,
        "User-Agent": "Jotazo-RBX/1.0",
      },
      body: JSON.stringify({
        [service]: { ...payload, authentication_key: authKeyV2 },
      }),
      signal: AbortSignal.timeout(20000),
    });
    const t = await r.text();
    try {
      return JSON.parse(t);
    } catch {
      console.warn(`rbxFetchV2 non-JSON response from "${service}" status=${r.status} body=${t.slice(0, 300)}`);
      return { status: 0, error_description: "Resposta não é JSON", body: t.slice(0, 500) };
    }
  } catch (e) {
    console.error(`rbxFetchV2 error on "${service}":`, (e as Error).message);
    return { status: 0, error_description: (e as Error).message };
  }
}

// =====================================================================
// Extractors (formatos documentados na RBX v2)
// =====================================================================
export const okStatus = (r: any) => r && (r.status === 1 || r.status === "1");
export const errDesc = (r: any) =>
  r?.error_description ? String(r.error_description) : (r == null ? "falha de rede" : "indisponível");

export function extractBoleto(billet: any) {
  if (!okStatus(billet)) return null;
  const r = billet.result;
  return {
    pdfUrl: r?.banking_billet_link || r?.link || r?.url || null,
    pdfBase64: r?.banking_billet_base64 || r?.pdf_base64 || r?.base64 || null,
    available: r?.banking_billet_available ?? null,
  };
}

export function extractBarcode(res: any): string {
  if (!okStatus(res)) return "";
  const r = res.result;
  if (typeof r === "string") return r;
  return r?.barcode || r?.line || r?.digitable_line || r?.linha_digitavel || r?.linha_digitavel_formatada || "";
}

export function extractPixCopia(res: any): string {
  if (!okStatus(res)) return "";
  const r = res.result;
  if (typeof r === "string") return r;
  return r?.pix_copia_cola || r?.copia_cola || r?.emv || r?.payload || "";
}

export function extractPixQr(res: any): string {
  if (!okStatus(res)) return "";
  const r = res.result;
  let v = "";
  if (typeof r === "string") v = r;
  else v = r?.qr_code || r?.qrcode || r?.qr_code_base64 || r?.image || r?.base64 || "";
  return String(v).replace(/^data:image\/[a-z]+;base64,/i, "");
}

// =====================================================================
// Invoice payables — fetcher único usado por produção e pelo teste real
// =====================================================================
export type InvoicePayablesPayloads = {
  billet: Record<string, unknown>;
  barcode: Record<string, unknown>;
  pixCopia: Record<string, unknown>;
  pixQr: Record<string, unknown>;
};

export type InvoicePayablesRaw = {
  billet: any;
  barcode: any;
  pixCopia: any;
  pixQrcode: any;
};

export type InvoicePayables = {
  payloads: InvoicePayablesPayloads;
  raw: InvoicePayablesRaw;
  boleto: ReturnType<typeof extractBoleto>;
  barcode: string;
  pixCopia: string;
  pixQrBase64: string;
};

/**
 * Chama em paralelo os 4 endpoints v2 que compõem a 2ª via de fatura,
 * usando exatamente os mesmos payloads em produção e no teste real.
 */
export async function fetchInvoicePayables(
  cfg: { endpointV2: string; authKeyV2: string },
  opts: { docId: number | string; dueDate?: string | null },
): Promise<InvoicePayables> {
  const docId = opts.docId;
  const due = opts.dueDate || undefined;

  const payloads: InvoicePayablesPayloads = {
    billet: {
      document_id: docId,
      // Não enviamos due_date por padrão para evitar erro "Data de vencimento não permitida" (ec 7)
      // quando o documento já está com a data atualizada. O RBX gera o PDF com a data original/atual.
    },
    barcode: {
      banking_billet_id: docId,
      ...(due ? { banking_billet_due_date: due } : {}),
      send_barcode: false,
      return_type: "line",
    },
    pixCopia: {
      banking_billet_id: docId,
      send_pix_copia_cola: false,
    },
    pixQrcode: {
      banking_billet_id: docId,
    },
  };

  const [billet, barcodeRes, pixCopia, pixQrcode] = await Promise.all([
    rbxFetchV2(cfg.endpointV2, cfg.authKeyV2, "get_banking_billet", payloads.billet),
    rbxFetchV2(cfg.endpointV2, cfg.authKeyV2, "get_barcode", payloads.barcode),
    rbxFetchV2(cfg.endpointV2, cfg.authKeyV2, "get_pix_copia_cola", payloads.pixCopia),
    rbxFetchV2(cfg.endpointV2, cfg.authKeyV2, "get_pix_qrcode", payloads.pixQrcode),
  ]);

  return {
    payloads,
    raw: { billet, barcode: barcodeRes, pixCopia, pixQrcode },
    boleto: extractBoleto(billet),
    barcode: extractBarcode(barcodeRes),
    pixCopia: extractPixCopia(pixCopia),
    pixQrBase64: extractPixQr(pixQrcode),
  };
}
