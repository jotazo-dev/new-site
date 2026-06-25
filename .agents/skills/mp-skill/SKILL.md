---
name: mp-skill
description: Integração Mercado Pago — Checkout Pro, Checkout Transparente (Pix/Boleto/Cartão), Bricks, Orders API, Subscriptions, Customers/Cards, Point/QR, Webhooks, Claims e Reports. Use quando o usuário pedir para integrar Mercado Pago, criar preference, gerar Pix ou boleto, processar cartão, salvar cartão (cofre), assinatura recorrente, validar webhook MP, ou implementar maquininha Point/QR in-store.
---

# Mercado Pago — Integração no Lovable

Base URL: `https://api.mercadopago.com`
Auth: `Authorization: Bearer <ACCESS_TOKEN>` (server-side apenas).
Idempotência: `X-Idempotency-Key: <uuid>` em todo POST de payment/refund/order.
Sites: MLB(BR), MLA(AR), MLM(MX), MLU(UY), MCO(CO), MLC(CL), MPE(PE).

## Regras críticas (não negociáveis)

1. `ACCESS_TOKEN` **só** em edge function — nunca no client. No frontend só `PUBLIC_KEY` via SDK MP.js v2.
2. Sempre setar `X-Idempotency-Key` em POSTs de pagamento, refund, order.
3. Webhook: validar `x-signature` HMAC-SHA256, responder 200 < 22s, e fazer GET autoritativo em `/v1/payments/{id}` antes de mudar status interno.
4. `notification_url` deve ser HTTPS público. Em Lovable: `https://<project>.supabase.co/functions/v1/mercadopago-webhook` com `verify_jwt = false` no `supabase/config.toml`.
5. Persistir `external_reference = order_id` para correlacionar webhook ↔ pedido.
6. Mapear `status`/`status_detail` MP → interno (`paid|pending|failed|refunded|chargeback`).
7. Pix: salvar `qr_code`, `qr_code_base64`, `ticket_url`, `date_of_expiration`.
8. Boleto: salvar `transaction_details.external_resource_url`, `barcode.content`, `date_of_expiration`.
9. Multi-país: parametrizar `site_id`, `currency_id`, `identification.type`.

## Secrets esperados (use `add_secret`)

- `MP_ACCESS_TOKEN` (server)
- `MP_PUBLIC_KEY` (pode ir em código/env público)
- `MP_WEBHOOK_SECRET` (HMAC do painel)
- Opcional sandbox: `MP_ACCESS_TOKEN_TEST`, `MP_PUBLIC_KEY_TEST`

## Quando usar qual produto

| Caso | Produto MP |
|---|---|
| Redirect simples, baixa fricção | Checkout Pro (`/checkout/preferences`) |
| UX próprio (Pix/Boleto/Cartão no site) | Checkout Transparente (`/v1/payments` + MP.js/Bricks) |
| Múltiplas tentativas/split avançado | Orders API (`/v1/orders`) |
| Recorrência | Subscriptions (`/preapproval_plan` + `/preapproval`) |
| Cobrança presencial via app | QR Code (`/instore/...`) |
| Maquininha física | Point (`/point/integration-api/...`) |

## Mapa de referências

| Tópico | Arquivo |
|---|---|
| Auth, X-Idempotency-Key, webhook signature | `references/auth-and-webhooks.md` |
| Preferences + back_urls + redirect | `references/checkout-pro.md` |
| `/v1/payments` Cartão / Pix / Boleto + Bricks | `references/checkout-transparente.md` |
| `/v1/orders` unificado, split, capture | `references/orders-api.md` |
| Recorrência (planos + assinaturas) | `references/subscriptions.md` |
| Cofre de cartão (`customers`/`cards`) | `references/customers-cards.md` |
| QR in-store + maquininha Point | `references/point-qr.md` |
| Claims, chargebacks, settlement reports | `references/claims-reports.md` |
| Cartões de teste BR + titulares APRO/OTHE/... | `references/test-cards.md` |
| Template Deno edge function (create + webhook) | `references/edge-function-template.ts` |

## Fluxo padrão Checkout Transparente (recomendado para Lovable)

```
[Client]                              [Edge: mp-create-payment]                 [MP]
 ├── Bricks/CardForm → card token  ──►│
 │                                    ├── POST /v1/payments (+X-Idempotency-Key)──►
 │                                    │◄── { id, status, status_detail, point_of_interaction }
 │◄── { orderId, status, pix/boleto } ┤
 │
[MP] ── POST notification_url ──► [Edge: mercadopago-webhook]
                                  ├── valida x-signature
                                  ├── GET /v1/payments/{id}  (autoritativo)
                                  └── update checkout_orders + enqueue provisioning
```

Para detalhes de payloads, campos de resposta, status e código pronto, abrir os arquivos em `references/`.
