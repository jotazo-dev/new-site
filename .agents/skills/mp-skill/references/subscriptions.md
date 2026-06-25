# Subscriptions (Pre-approvals)

## Planos
- `POST /preapproval_plan` — cria template de plano (valor/frequência)
- `GET  /preapproval_plan/{id}`
- `PUT  /preapproval_plan/{id}`

```json
{
  "reason":"Plano Premium",
  "auto_recurring":{
    "frequency":1,"frequency_type":"months",
    "transaction_amount":99.90,"currency_id":"BRL",
    "billing_day":10,"billing_day_proportional":true
  },
  "back_url":"https://site/assinatura/sucesso",
  "payment_methods_allowed":{"payment_types":[{"id":"credit_card"}]}
}
```

## Assinaturas
- `POST /preapproval` — se passar `card_token_id` cobra direto; se passar só `payer_email` retorna `init_point` para o usuário escolher cartão
- `GET  /preapproval/{id}`
- `PUT  /preapproval/{id}` — pausar (`status:"paused"`), retomar (`status:"authorized"`), cancelar (`status:"cancelled"`), trocar valor
- `GET  /preapproval/search?...`

## Cobranças geradas
- `GET /authorized_payments/{id}`
- `GET /authorized_payments/search?preapproval_id=...`

## Webhooks
- `subscription_preapproval` — mudanças na assinatura
- `subscription_authorized_payment` — cada cobrança recorrente gerada
