# Checkout Pro (Preferences + Redirect)

Fluxo: backend cria preference → recebe `init_point` (prod) ou `sandbox_init_point` → redireciona usuário → MP processa → redireciona para `back_urls` → envia webhook `payment` e `merchant_order`.

## Endpoints

| Método | Path |
|---|---|
| POST | `/checkout/preferences` |
| GET  | `/checkout/preferences/{id}` |
| PUT  | `/checkout/preferences/{id}` |

## Payload

```json
{
  "items": [
    { "id":"sku","title":"Plano X","description":"...","quantity":1,
      "unit_price":99.90,"currency_id":"BRL","category_id":"services" }
  ],
  "payer": {
    "name":"","surname":"","email":"",
    "identification":{"type":"CPF","number":""},
    "phone":{"area_code":"","number":""},
    "address":{"street_name":"","street_number":1,"zip_code":""}
  },
  "back_urls": {
    "success":"https://site/checkout/sucesso?orderId=...",
    "failure":"https://site/checkout/erro?orderId=...",
    "pending":"https://site/checkout/pendente?orderId=..."
  },
  "auto_return": "approved",
  "payment_methods": {
    "excluded_payment_types": [{"id":"ticket"}],
    "excluded_payment_methods": [{"id":"amex"}],
    "installments": 12,
    "default_installments": 1
  },
  "notification_url": "https://<project>.supabase.co/functions/v1/mercadopago-webhook",
  "statement_descriptor": "JOTAZO",
  "external_reference": "<order_id>",
  "expires": true,
  "expiration_date_from": "2026-06-21T12:00:00.000-03:00",
  "expiration_date_to":   "2026-06-22T12:00:00.000-03:00",
  "metadata": { "order_id": "<order_id>" },
  "binary_mode": false
}
```

Resposta-chave: `id`, `init_point`, `sandbox_init_point`, `client_id`, `collector_id`, `date_of_expiration`.

## Tratamento no retorno

Query string em `back_urls`:
```
?collection_id=...&collection_status=approved&payment_id=...
 &status=approved&external_reference=<order_id>
 &payment_type=credit_card&merchant_order_id=...
 &preference_id=...&site_id=MLB&processing_mode=aggregator
```

Não confiar no retorno — sempre aguardar webhook + GET `/v1/payments/{id}`.

## Merchant Orders

- `GET /merchant_orders/{id}` → agrupa todos os payments+shipments de uma preference.
- `GET /merchant_orders/search?preference_id=...`
- Webhook `topic=merchant_order` dispara quando algum payment associado muda.
