# Cartão Protegido (tokenização) + VerifyCard

Doc oficial: `https://docs.cielo.com.br/gateway/docs/cartao-protegido.md` · `https://docs.cielo.com.br/gateway/reference/cp-api.md`

API separada para armazenar cartões em ambiente PCI-DSS, devolvendo um `CardToken` reutilizável.

## Endpoints

| Operação | Endpoint |
|---|---|
| Autenticação (obter access_token) | `POST /v1/oauth/access-token` (Basic auth `ClientId:ClientSecret`) |
| Criar token | `POST /v1/Token` |
| Consultar token | `GET /v1/Token/{TokenReference}` |
| Obter por alias | `GET /v1/Token/Alias/{alias}` |
| Suspender | `PUT /v1/Token/{TokenReference}/Suspend` |
| Reativar | `PUT /v1/Token/{TokenReference}/Reactivate` |
| Excluir | `DELETE /v1/Token/{TokenReference}` |

Hosts:
- Sandbox: `https://cartaoprotegidoapisandbox.braspag.com.br`
- Produção: `https://cartaoprotegidoapi.braspag.com.br`

## Tokenizar antes da venda

```json
POST /v1/Token
{
  "MerchantId": "...",
  "Alias": "cliente-123-cartao-1",     // opcional
  "Card": {
    "Number": "0000000000000001",
    "Holder": "Comprador Teste",
    "Expiration": "12/2030",
    "SecurityCode": "123",
    "Brand": "Visa"
  }
}
```

Resposta:
```json
{
  "TokenReference": "guid-token",
  "Alias": "cliente-123-cartao-1",
  "Status": "Valid",
  "MaskedNumber": "000000******0001"
}
```

## Tokenizar durante autorização

No POST `/v2/sales/` enviar `Payment.CreditCard.SaveCard: true`. A resposta traz `Payment.CreditCard.CardToken`.

## Pagar com token

```json
{
  "MerchantOrderId": "...",
  "Payment": {
    "Type": "CreditCard",
    "Amount": 4990,
    "Installments": 1,
    "Capture": true,
    "Provider": "Cielo30",
    "CreditCard": {
      "CardToken": "guid-token",
      "SecurityCode": "123",   // opcional (depende do caso)
      "Brand": "Visa"
    }
  }
}
```

## VerifyCard / Zero Auth

Validar se o cartão está ativo **sem cobrar**:

```http
POST /v2/sales/  (com Payment.Amount=0 e Payment.Type="CreditCard")
```

Ou endpoint dedicado:
- `POST /v1/zeroauth` (Gateway) — devolve `Valid: true|false`.
- `https://docs.cielo.com.br/gateway/reference/api-verify-card.md` — VerifyCard (Visa/Master/Elo). Retorna `Status`, `ReturnCode`, BIN data.

Útil antes de salvar cartão para recorrência.

## Renova Fácil

Atualiza automaticamente token quando emissor troca número/validade. Disponível só para Visa/Master via Cielo 3.0 e solicitação ao Suporte.

## Segurança

- `MerchantKey` do Cartão Protegido é separado do MerchantKey do Gateway.
- PAN/CVV trafegam apenas para o endpoint do Cartão Protegido ou via Silent Order Post (form direto do navegador → Braspag).
- Nunca persistir PAN/CVV no banco da loja.
