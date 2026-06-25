# Recorrência (Cartão de Crédito)

Doc oficial: `https://docs.cielo.com.br/gateway/docs/recorrencia.md` · `https://docs.cielo.com.br/gateway/reference/agenda-uma-autorizaçãoo.md`

Apenas **cartão de crédito**. **Não permite parcelamento.** Não exige CVV nas recorrências subsequentes. Requer Mod10 válido.

## Modalidades

1. **Recorrência programada (server-side Cielo)** — Cielo gera as cobranças nas datas configuradas.
2. **Recorrência não programada (lojista controla)** — loja dispara cada cobrança usando cartão tokenizado.

## Autorizar primeira transação + agendar próximas

```json
{
  "MerchantOrderId": "ASSINATURA-001",
  "Customer": { "Name": "Comprador", "Identity": "11111111111", "IdentityType": "CPF" },
  "Payment": {
    "Type": "CreditCard",
    "Amount": 4990,
    "Installments": 1,
    "Capture": true,
    "SoftDescriptor": "Assinatura",
    "Provider": "Cielo30",
    "CreditCard": {
      "CardNumber": "0000000000000001",
      "Holder": "Comprador",
      "ExpirationDate": "12/2030",
      "SecurityCode": "123",
      "Brand": "Visa"
    },
    "RecurrentPayment": {
      "AuthorizeNow": true,
      "EndDate": "2030-12-31",
      "Interval": "Monthly"   // Monthly|Bimonthly|Quarterly|SemiAnnual|Annual ou dias
    }
  }
}
```

Retorno traz `Payment.RecurrentPayment.RecurrentPaymentId` (GUID). Persistir.

## Agendar (sem cobrar agora)

`AuthorizeNow: false` + `StartDate: "2024-12-01"`.

## Operações sobre a recorrência

| Operação | Endpoint |
|---|---|
| Consultar | `GET /v2/sales/{RecurrentPaymentId}/RecurrentPayment` (host de consulta) |
| Desabilitar | `PUT /v2/RecurrentPayment/{RecurrentPaymentId}/Deactivate` |
| Reativar | `PUT /v2/RecurrentPayment/{RecurrentPaymentId}/Reactivate` |
| Alterar valor | `PUT /v2/RecurrentPayment/{RecurrentPaymentId}/Amount` body `{ "Amount": 5990 }` |
| Alterar data próximo pagamento | `PUT /.../NextPaymentDate` |
| Alterar dia da recorrência | `PUT /.../RecurrencyDay` |
| Alterar intervalo | `PUT /.../Interval` |
| Alterar data final | `PUT /.../EndDate` |
| Alterar dados pagamento | `PUT /.../Payment` |
| Alterar dados comprador | `PUT /.../Customer` |
| Agendar ajuste de valor futuro | `POST /v2/RecurrentPayment/{Id}/ScheduledAdjustment` |
| Alterar ajuste | `PUT /v2/RecurrentPayment/{Id}/ScheduledAdjustment/{AdjId}` |
| Cancelar ajuste | `DELETE /v2/RecurrentPayment/{Id}/ScheduledAdjustment/{AdjId}` |

## Recorrência não programada com cartão tokenizado

```json
{
  "MerchantOrderId": "COBRANCA-456",
  "Payment": {
    "Type": "CreditCard",
    "Amount": 4990,
    "Installments": 1,
    "Capture": true,
    "Provider": "Cielo30",
    "CreditCard": {
      "CardToken": "guid-do-cartao-protegido",
      "Brand": "Visa"
    },
    "InitiatedTransactionIndicator": {
      "Category": "C1",
      "Subcategory": "CredentialOnFile"
    }
  }
}
```

`InitiatedTransactionIndicator` informa à bandeira que é MIT (Merchant Initiated). Combinar com `Payment.IssuerTransactionId` da primeira transação para Mastercard/Visa.

## Renova Fácil

Quando habilitado, cartão bloqueado/cancelado é atualizado automaticamente pelo emissor — token (`CardToken`) continua válido. Solicitar habilitação ao Suporte Cielo.

## Status da recorrência

Lista oficial em `https://docs.cielo.com.br/gateway/reference/lista-de-status-da-recorrência.md` (Active, Paused, EndDateReached, Deactivated…).
