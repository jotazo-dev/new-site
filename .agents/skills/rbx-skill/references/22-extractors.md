# Extractors — como achatar respostas v2

Os endpoints financeiros v2 (`get_banking_billet`, `get_barcode`, `get_pix_copia_cola`, `get_pix_qrcode`) retornam payloads com várias chaves possíveis dependendo da versão do RBX e do banco emissor. O projeto Jotazo já tem extractors prontos em `supabase/functions/_shared/rbx.ts`. **Reuse-os** em qualquer nova edge function.

## API dos extractors

```ts
import {
  okStatus, errDesc,
  extractBoleto, extractBarcode,
  extractPixCopia, extractPixQr,
  fetchInvoicePayables,
} from "../_shared/rbx.ts";
```

### `extractBoleto(res)` — `get_banking_billet`

Retorna `{ pdfUrl, pdfBase64, available }` ou `null` em erro.

Chaves testadas (em ordem): `banking_billet_link` → `link` → `url`; `banking_billet_base64` → `pdf_base64` → `base64`.

### `extractBarcode(res)` — `get_barcode`

Retorna a string (linha digitável formatada). Chaves testadas: `barcode` → `line` → `digitable_line` → `linha_digitavel` → `linha_digitavel_formatada`.

**Payload de envio:**
```json
{ "banking_billet_id": 123, "send_barcode": false, "return_type": "line" }
```

### `extractPixCopia(res)` — `get_pix_copia_cola`

Retorna a string EMV (copia-cola). Chaves: `pix_copia_cola` → `copia_cola` → `emv` → `payload`.

### `extractPixQr(res)` — `get_pix_qrcode`

Retorna o **base64 puro** (sem prefixo `data:image/...`). Já faz o strip do prefixo automaticamente.

## Tudo de uma vez: `fetchInvoicePayables`

Chama os 4 endpoints **em paralelo** e devolve tudo achatado:

```ts
const cfg = await loadRbxConfig();
const payables = await fetchInvoicePayables(
  { endpointV2: cfg!.endpointV2, authKeyV2: cfg!.authKeyV2! },
  { docId: 12345, dueDate: "2025-06-15" }, // dueDate é opcional, mas omitir é mais seguro
);
// payables.boleto = { pdfUrl, pdfBase64, available }
// payables.barcode = "23793.38128 60082..."
// payables.pixCopia = "00020101021226..."
// payables.pixQrBase64 = "iVBORw0KGgoAAAA..." (sem data: prefix)
// payables.raw = { billet, barcode, pixCopia, pixQrcode } — respostas cruas p/ debug
// payables.payloads = { ... } — payloads enviados (útil em testes)
```

**Padrão usado em produção:** `/minhaconta` (página do cliente) e `rbx-test-invoice-extraction` (testes admin).

## Gotcha do `due_date`

Não envie `due_date` em `get_banking_billet` por padrão. Quebra com `erro_code: 7` quando o documento já está atualizado. O RBX gera o PDF com a data correta sozinho. Para `get_barcode` é OK passar `banking_billet_due_date` (se vier do `result` do `get_banking_billet`).
