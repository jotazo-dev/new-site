# Auth, Idempotência e Webhooks

## Headers obrigatórios

```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
X-Idempotency-Key: <uuid-v4>     # obrigatório em POST /v1/payments, /v1/orders, refunds
```

`X-Idempotency-Key` deve ser **persistido junto ao pedido**; reenvios com a mesma chave retornam a resposta original sem cobrar de novo.

## OAuth (apenas marketplace / agências conectando contas terceiras)

```
GET https://auth.mercadopago.com.br/authorization
  ?client_id=APP_ID
  &response_type=code
  &platform_id=mp
  &redirect_uri=https://...
  &state=<csrf>

POST /oauth/token
  grant_type=authorization_code | refresh_token
  client_id, client_secret, code | refresh_token, redirect_uri
→ { access_token, refresh_token, user_id, public_key, expires_in, scope }
```

Marketplace fee: campo `marketplace_fee` (Preferences/Payments) ou `application_fee` (Orders).

## Webhooks

Configurar `notification_url` no payload **ou** URL global no painel do app. Tópicos:
`payment`, `merchant_order`, `subscription_preapproval`, `subscription_authorized_payment`, `point_integration_wh`, `mp-connect`, `delivery`, `claim`, `chargebacks`.

Body recebido:
```json
{
  "id": "12345",
  "type": "payment",
  "action": "payment.updated",
  "data": { "id": "PAYMENT_ID" },
  "live_mode": true,
  "user_id": "...",
  "date_created": "2026-06-21T..."
}
```

### Validação `x-signature` (HMAC-SHA256)

Headers recebidos:
- `x-signature: ts=<unix>,v1=<hex>`
- `x-request-id: <uuid>`

Manifest assinado:
```
id:<data.id>;request-id:<x-request-id>;ts:<ts>;
```

Pseudocódigo:
```ts
const [tsPart, v1Part] = req.headers.get("x-signature")!.split(",");
const ts = tsPart.split("=")[1];
const sig = v1Part.split("=")[1];
const manifest = `id:${body.data.id};request-id:${req.headers.get("x-request-id")};ts:${ts};`;
const key = await crypto.subtle.importKey("raw", enc.encode(SECRET),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const mac = await crypto.subtle.sign("HMAC", key, enc.encode(manifest));
const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2,"0")).join("");
// comparar em tempo constante
```

### Regras de processamento

1. Responder 200/201 em < 22s. Processamento pesado em background.
2. Após validar signature, **sempre** `GET /v1/payments/{data.id}` (autoritativo) antes de mudar status interno.
3. MP faz retry exponencial por ~3 dias se não receber 2xx.
4. Idempotência no consumo: armazenar `data.id`+`action`+`ts` para deduplicar.

## Status interno sugerido

| MP `status` | Interno |
|---|---|
| `approved` / `authorized` (capture true) | `paid` |
| `authorized` (capture false) | `authorized` |
| `pending` / `in_process` / `in_mediation` | `pending` |
| `rejected` / `cancelled` | `failed` |
| `refunded` (total) | `refunded` |
| `charged_back` | `chargeback` |

`status_detail` guarda o motivo bruto para suporte.
