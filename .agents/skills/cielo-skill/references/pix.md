# Pix (Cielo2 — nova integração obrigatória)

Doc oficial: `https://docs.cielo.com.br/gateway/docs/pix-cielo.md` · `https://docs.cielo.com.br/gateway/reference/cielo2-gerar-pix.md`

A partir de 01/10 toda integração Pix Cielo deve usar `Payment.Provider = "Cielo2"`. **Não há sandbox** — testar em produção com valor mínimo (R$ 0,01).

## Gerar QR Code

```http
POST https://api.braspag.com.br/v2/sales/
```

```json
{
  "MerchantOrderId": "1234567890",
  "Customer": {
    "Name": "Comprador Teste",
    "Identity": "11111111111",
    "IdentityType": "CPF"
  },
  "Payment": {
    "Type": "Pix",
    "Amount": 100,
    "Provider": "Cielo2",
    "QrCodeExpiration": 1800     // segundos. Padrão 86400 (24h). Máx 24h.
  }
}
```

### Resposta

```json
{
  "MerchantOrderId": "7a8...",
  "Payment": {
    "QrCodeBase64Image": "iVBORw0KGgo...",
    "QrCodeString": "00020101021226...5204000053039865802BR...",
    "SentOrderId": "f72...",                 // txid
    "PaymentId": "f72965cb-e5d3-42fd-8fc3-4eaa51c9427e",
    "Type": "Pix",
    "Amount": 100,
    "ReceivedDate": "2024-11-25 11:30:33",
    "Currency": "BRL",
    "Provider": "Cielo2",
    "Status": 12,                            // Pending
    "ReasonCode": 0,
    "ReasonMessage": "Successful",
    "ProviderReturnCode": "0",
    "ProviderReturnMessage": "QRCode gerado com sucesso"
  }
}
```

Renderizar `QrCodeBase64Image` (`<img src="data:image/png;base64,...">`) **e** o copia-e-cola (`QrCodeString`).

## Identificadores

- `SentOrderId` = `txid` (criação).
- `EndToEndId` = id do Pix pago (aparece **só na consulta após pagamento**).
- Conciliar por `EndToEndId` + `txid`.

## Consultar transação Pix

```http
GET https://apiquery.braspag.com.br/v2/sales/{PaymentId}
```

Status:
| Code | Status |
|---|---|
| 12 | Pending (aguardando pagamento) |
| 2 | PaymentConfirmed (Pix pago) |
| 13 | Aborted (QR Code expirou/removido) |
| 11 | Refunded (devolvido) |

## Remover QR Code

```http
DELETE https://api.braspag.com.br/v2/sales/Pix/{PaymentId}
```

## Devolução (refund) Pix

Total:
```http
POST https://api.braspag.com.br/v2/sales/{PaymentId}/void
```

Parcial:
```http
POST https://api.braspag.com.br/v2/sales/{PaymentId}/void?amount=50
```

Status final `11 Refunded` (total) ou continua `2` com nó de devoluções (parcial).

## Mudança de campos (Cielo30 → Cielo2)

| Campo | Antes (Cielo30) | Agora (Cielo2) |
|---|---|---|
| `AcquirerOrderId` | ID do QR Code | Removido |
| `ProofOfSale` | NSU | Removido |
| `SentOrderId` | espelhava `MerchantOrderId` | Agora = `txid` |
| `QrCodeExpiration` | fixo 2h | Configurável até 24h |

## Webhook

Recebe `POST` na `UrlNotification` quando o status muda (pagamento, devolução, expiração). Body: `{ "PaymentId": "...", "ChangeType": 1 }`. Sempre re-consultar via GET.
