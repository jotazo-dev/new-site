# Checkout Transparente — `/v1/payments`

Backend cria o pagamento diretamente. Para cartão, o token vem do frontend (SDK MP.js v2 / CardForm / Bricks). Para Pix/Boleto, basta payer + amount.

## Endpoints

| Método | Path | Uso |
|---|---|---|
| POST | `/v1/payments` | cria pagamento (header `X-Idempotency-Key`) |
| GET  | `/v1/payments/{id}` | consulta |
| GET  | `/v1/payments/search` | lista (filtros: `external_reference`, `status`, `range`, `begin_date`, `end_date`) |
| PUT  | `/v1/payments/{id}` | capture/cancel |
| POST | `/v1/payments/{id}/refunds` | refund total/parcial `{ "amount": 12.34 }` |
| GET  | `/v1/payments/{id}/refunds` | lista refunds |
| GET  | `/v1/payments/{id}/refunds/{refund_id}` | detalhe |

## Payload — Cartão

```json
{
  "transaction_amount": 100.00,
  "token": "<card_token do SDK>",
  "description": "Pedido #123",
  "installments": 1,
  "payment_method_id": "visa",
  "issuer_id": "25",
  "payer": {
    "email":"x@y.com",
    "identification":{"type":"CPF","number":"..."},
    "first_name":"","last_name":""
  },
  "statement_descriptor": "JOTAZO",
  "external_reference": "<order_id>",
  "notification_url": "https://.../mercadopago-webhook",
  "binary_mode": false,
  "capture": true,
  "three_d_secure_mode": "optional",
  "metadata": { "order_id": "<order_id>" }
}
```

Resposta principal: `id`, `status`, `status_detail`, `authorization_code`, `transaction_details.installment_amount`, `card.last_four_digits`, `card.first_six_digits`.

### Captura tardia
- `capture:false` no POST → autorização
- `PUT /v1/payments/{id}` body `{"capture": true}` → captura
- `PUT /v1/payments/{id}` body `{"status":"cancelled"}` → cancela autorização

## Payload — Pix

```json
{
  "transaction_amount": 100.00,
  "description": "Pedido #123",
  "payment_method_id": "pix",
  "payer": {
    "email":"x@y.com","first_name":"","last_name":"",
    "identification":{"type":"CPF","number":""}
  },
  "date_of_expiration": "2026-06-22T12:00:00.000-03:00",
  "external_reference": "<order_id>",
  "notification_url": "..."
}
```

Resposta — `point_of_interaction.transaction_data`:
- `qr_code` (copia-e-cola EMV)
- `qr_code_base64` (PNG em base64 — usar `data:image/png;base64,...`)
- `ticket_url` (página MP com QR + cópia)

## Payload — Boleto / "ticket" / lotérica (PEC)

```json
{
  "transaction_amount": 100.00,
  "description": "...",
  "payment_method_id": "bolbradesco",
  "payer": {
    "email":"","first_name":"","last_name":"",
    "identification":{"type":"CPF","number":""},
    "address":{"zip_code":"","street_name":"","street_number":"","neighborhood":"","city":"","federal_unit":""}
  },
  "date_of_expiration": "2026-06-25T23:59:59.000-03:00",
  "external_reference": "<order_id>",
  "notification_url": "..."
}
```

Outros `payment_method_id`: `bolbradesco`, `pec` (lotérica/Pagamento em Casa).

Resposta:
- `transaction_details.external_resource_url` → PDF do boleto
- `barcode.content` → linha digitável
- `date_of_expiration`

## Status (`status`)
`pending`, `approved`, `authorized`, `in_process`, `in_mediation`, `rejected`, `cancelled`, `refunded`, `charged_back`.

## `status_detail` (cartão — principais)
`accredited`, `pending_contingency`, `pending_review_manual`,
`cc_rejected_bad_filled_card_number`, `cc_rejected_bad_filled_date`,
`cc_rejected_bad_filled_security_code`, `cc_rejected_bad_filled_other`,
`cc_rejected_blacklist`, `cc_rejected_call_for_authorize`,
`cc_rejected_card_disabled`, `cc_rejected_duplicated_payment`,
`cc_rejected_high_risk`, `cc_rejected_insufficient_amount`,
`cc_rejected_invalid_installments`, `cc_rejected_max_attempts`,
`cc_rejected_other_reason`.

## SDK MP.js v2 (frontend)

```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
<script>
  const mp = new MercadoPago("<PUBLIC_KEY>", { locale: "pt-BR" });
  // Opção 1: Bricks — payment / cardPayment / wallet / statusScreen / brand
  const bricks = mp.bricks();
  await bricks.create("cardPayment", "containerId", {
    initialization: { amount: 100.00 },
    callbacks: {
      onSubmit: async (formData) => {
        // formData.token, payment_method_id, issuer_id, installments, payer
        await fetch("/functions/v1/mp-create-payment", { method:"POST",
          body: JSON.stringify({ ...formData, orderId }) });
      }
    }
  });
</script>
```

Para Pix/Boleto não há tokenização — basta o backend criar `/v1/payments` com os dados do payer.
