# Cartão de Crédito

Doc oficial: `https://docs.cielo.com.br/gateway/reference/credito-api.md`

## Endpoint

| Ambiente | Método | URL |
|---|---|---|
| Sandbox | POST | `https://apisandbox.braspag.com.br/v2/sales/` |
| Produção | POST | `https://api.braspag.com.br/v2/sales/` |

## Payload mínimo

```json
{
  "MerchantOrderId": "2024110001",
  "Customer": {
    "Name": "Comprador Teste",
    "Identity": "11111111111",
    "IdentityType": "CPF",
    "Email": "comprador@teste.com"
  },
  "Payment": {
    "Type": "CreditCard",
    "Amount": 15700,            // em centavos
    "Installments": 1,
    "Capture": false,           // true = captura automática
    "SoftDescriptor": "LojaXYZ",
    "Provider": "Simulado",     // sandbox: "Simulado". Produção: "Cielo30", "Rede", "Getnet"...
    "CreditCard": {
      "CardNumber": "0000000000000001",
      "Holder": "Comprador Teste",
      "ExpirationDate": "12/2030",
      "SecurityCode": "123",
      "Brand": "Visa",          // Visa, Master, Amex, Elo, Diners, Discover, JCB, Aura, Hipercard
      "SaveCard": false         // true = tokeniza no Cartão Protegido
    }
  }
}
```

### Parcelamento

- `Installments`: 1..N. Para parcelado-loja, adicionar `Interest: "ByMerchant"`; emissor: `"ByIssuer"`.
- JCB e Diners não permitem parcelar.

### 3DS opcional (crédito)

Adicionar quando vier autenticação externa:
```json
"Authenticate": true,
"ExternalAuthentication": {
  "Cavv": "...",
  "Xid": "...",
  "Eci": "05",
  "Version": "2",
  "ReferenceID": "...",
  "DataOnly": false
}
```

### Antifraude (Cybersource/ClearSale)

Adicionar nó `Payment.FraudAnalysis` com `Provider: "Cybersource"|"ClearSale"`, `Cart`, `Shipping`, `Browser` etc. Ver `references/status-e-codigos-retorno.md` (status do AF) e doc oficial.

## Resposta principal

```json
{
  "MerchantOrderId": "2024110001",
  "Payment": {
    "PaymentId": "f72965cb-e5d3-42fd-8fc3-4eaa51c9427e",
    "Type": "CreditCard",
    "Amount": 15700,
    "Currency": "BRL",
    "Country": "BRA",
    "Provider": "Cielo30",
    "Status": 1,                  // 1 Authorized / 2 PaymentConfirmed / 3 Denied
    "ReasonCode": 0,
    "ReasonMessage": "Successful",
    "ProviderReturnCode": "4",
    "ProviderReturnMessage": "Operation Successful",
    "AuthorizationCode": "123456",
    "ProofOfSale": "20241101001",
    "Tid": "0710171753688",
    "AcquirerTransactionId": "...",
    "Eci": "05"
  }
}
```

Sempre persistir `PaymentId`, `MerchantOrderId`, `Tid`, `ProofOfSale`, `AuthorizationCode`, `Status`, `Provider`, `Amount`.

## Captura posterior

```http
PUT /v2/sales/{PaymentId}/capture?amount=15700&serviceTaxAmount=0
```

- Sem `amount` = captura total.
- Após captura, status vira `2`.

## Cancelamento / estorno

```http
PUT /v2/sales/{PaymentId}/void?amount=15700
```

- Mesmo dia da autorização: cancelamento (`Status=10 Voided`).
- Dia seguinte ou após captura: estorno (`Status=11 Refunded`).
- Parcial só funciona se `Capture=true`.

Ver `references/captura-cancelamento.md` para regras detalhadas.
