# Captura, Cancelamento, Estorno e Consulta

Docs: `https://docs.cielo.com.br/gateway/docs/captura.md` · `https://docs.cielo.com.br/gateway/docs/cancelamento.md`

## Captura (somente cartão de crédito)

Só captura transações com `Status=1 Authorized`. Após captura → `Status=2 PaymentConfirmed`. Não dá para capturar duas vezes.

### Tipos

| Tipo | Como |
|---|---|
| Automática | `Payment.Capture=true` na criação |
| Posterior | `PUT /v2/sales/{PaymentId}/capture` |
| Em lote | Portal E-commerce |

### Endpoint

```http
PUT https://api.braspag.com.br/v2/sales/{PaymentId}/capture
PUT https://api.braspag.com.br/v2/sales/{PaymentId}/capture?amount=10000
PUT https://api.braspag.com.br/v2/sales/{PaymentId}/capture?amount=10000&serviceTaxAmount=500
```

- Sem `amount` = captura total.
- `serviceTaxAmount`: companhias aéreas/turismo.

### Resposta

```json
{
  "Status": 2,
  "ReasonCode": 0,
  "ReasonMessage": "Successful",
  "ProviderReturnCode": "6",
  "ProviderReturnMessage": "Operation Successful"
}
```

## Cancelamento / Estorno

Funciona para crédito e débito (e Pix por `POST /void`).

### Endpoint

```http
PUT https://api.braspag.com.br/v2/sales/{PaymentId}/void
PUT https://api.braspag.com.br/v2/sales/{PaymentId}/void?amount=5000
```

### Regras

- `Amount` ausente ou `0` → estorno total.
- Parcial só funciona se `Capture=true`.
- Crédito permite múltiplos parciais até zerar.
- Débito: parcial varia por adquirente.
- Voucher Alelo: parcial **não** permitido; estorno **não** permitido.
- Antes da meia-noite do dia da autorização → `Voided (10)`. Depois → `Refunded (11)`.
- Pix: status final `11 Refunded` (total) ou nó `VoidedAmount`/refunds (parcial).

### Resposta

```json
{
  "Status": 10,
  "ReasonCode": 0,
  "ReasonMessage": "Successful",
  "ProviderReturnCode": "9",
  "ProviderReturnMessage": "Operation Successful"
}
```

## Consultas

| Por | Endpoint |
|---|---|
| `PaymentId` | `GET https://apiquery.braspag.com.br/v2/sales/{PaymentId}` |
| `MerchantOrderId` | `GET https://apiquery.braspag.com.br/v2/sales?merchantOrderId=...` (lista de PaymentIds) |
| `RecurrentPaymentId` | `GET https://apiquery.braspag.com.br/v2/sales/{Id}/RecurrentPayment` |

Use o host de **consulta** (`apiquery*`). Mesmos headers `MerchantId`/`MerchantKey`.

Sempre fazer **sondagem** (polling) de transações pendentes diariamente em vez de confiar 100% no webhook.
