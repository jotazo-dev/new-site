# Boleto Registrado

Doc oficial: `https://docs.cielo.com.br/gateway/reference/boleto-api.md`

Desde 21/07/2018 todo boleto e-commerce deve ser **registrado** (FEBRABAN). Cielo Gateway suporta múltiplos bancos via `Payment.Provider`.

## Providers e regras de tamanho

| Banco | Provider | `MerchantOrderId` | `BoletoNumber` | `Name` | `City` | Observações |
|---|---|---|---|---|---|---|
| Bradesco | `Bradesco2` | 27 (letras, números, `_`, `$`) | 11 (único) | 34 | 50 | – |
| Banco do Brasil | `BancoDoBrasil3` | 50 | 9 (últimos dígitos se >9) | 60 | 18 | A-Z maiúsculas + hífen/apóstrofo. `DigitableLine` não retorna |
| Itaú API | `Itau3` | 8 | 8 (== MerchantOrderId) | 30 | 15 | – |
| Santander | `Santander2` | 50 | 13 (único) | 40 | 30 | – |
| Citibank | `Citibank2` | 10 | 11 (gera aleatório se passar) | 50 | 50 | Remove acentos |
| Sandbox | `Simulado` | qualquer | – | – | – | Não emite boleto real |

> Caixa Econômica: indisponível por tempo indeterminado.

## Payload

```json
{
  "MerchantOrderId": "2024110003",
  "Customer": {
    "Name": "COMPRADOR TESTE",
    "Identity": "11111111111",
    "IdentityType": "CPF",
    "Address": {
      "Street": "Rua Teste",
      "Number": "100",
      "Complement": "Apto 1",
      "ZipCode": "01310100",
      "City": "Sao Paulo",
      "State": "SP",
      "Country": "BRA",
      "District": "Bela Vista"
    }
  },
  "Payment": {
    "Type": "Boleto",
    "Amount": 15700,
    "Provider": "Bradesco2",
    "Address": "Rua da Loja, 1 - SP",
    "BoletoNumber": "12345678901",
    "Assignor": "Loja XYZ Ltda",
    "Demonstrative": "Pedido 2024110003",
    "ExpirationDate": "2030-12-31",
    "Identification": "12345678000190",
    "Instructions": "Não receber após o vencimento. Multa 2%, juros 1% a.m."
  }
}
```

## Resposta

```json
{
  "MerchantOrderId": "2024110003",
  "Payment": {
    "PaymentId": "...",
    "Type": "Boleto",
    "Provider": "Bradesco2",
    "Status": 1,                 // Authorized = boleto gerado, aguardando pagamento
    "Amount": 15700,
    "BoletoNumber": "12345678901",
    "BarCodeNumber": "23793.39126 60028.041501 21000.001237 1 12345678901",
    "DigitableLine": "23793391266002804150121000001237112345678901",
    "Url": "https://.../boleto.pdf",
    "ExpirationDate": "2030-12-31",
    "Assignor": "Loja XYZ Ltda"
  }
}
```

Disponibilizar `Url` (PDF), `DigitableLine` e `BarCodeNumber` ao comprador.

## Confirmação de pagamento

Vem via **webhook** (`ChangeType=1`) ou via `GET /v2/sales/{PaymentId}`. Status passa para `2 PaymentConfirmed` quando o banco compensa.

## Cancelamento

Antes do pagamento: `PUT /v2/sales/{PaymentId}/void` cancela o registro.
