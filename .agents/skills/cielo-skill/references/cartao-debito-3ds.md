# Cartão de Débito + 3DS 2.2

Doc oficial: `https://docs.cielo.com.br/gateway/reference/debito-api.md` · `https://docs.cielo.com.br/gateway/docs/autenticacao-3ds.md`

Cartão de débito **exige autenticação 3DS 2.2** (EMV 3DS) por bandeira/emissor. Não é opcional.

## Fluxo

```
1. Loja chama 3DS Server (Cielo ou externo) → obtém Cavv/Xid/Eci/Version
2. Loja chama POST /v2/sales/ com Payment.Type="DebitCard",
   Payment.Authenticate=true e ExternalAuthentication preenchido
3. Resposta traz Payment.AuthenticationUrl quando há desafio (frictionless = direto Authorized)
4. Loja redireciona comprador para AuthenticationUrl; emissor desafia (OTP/biometria)
5. Comprador volta → status atualiza para 2 PaymentConfirmed ou 3 Denied
```

## Payload

```json
{
  "MerchantOrderId": "2024110002",
  "Customer": { "Name": "Comprador", "Identity": "11111111111", "IdentityType": "CPF" },
  "Payment": {
    "Type": "DebitCard",
    "Amount": 9900,
    "ReturnUrl": "https://loja.com/retorno-debito",
    "Provider": "Cielo30",
    "Authenticate": true,
    "DebitCard": {
      "CardNumber": "4551870000000183",
      "Holder": "Comprador Teste",
      "ExpirationDate": "12/2030",
      "SecurityCode": "123",
      "Brand": "Visa"
    },
    "ExternalAuthentication": {
      "Cavv": "...",
      "Xid": "...",
      "Eci": "05",
      "Version": "2",
      "ReferenceID": "..."
    }
  }
}
```

## Resposta com desafio

```json
{
  "Payment": {
    "Status": 0,
    "AuthenticationUrl": "https://...",
    "PaymentId": "...",
    "ProviderReturnCode": "...",
    "ReasonCode": 9    // Waiting
  }
}
```

Redirecionar o navegador para `AuthenticationUrl`. Após o callback no `ReturnUrl`, consultar `GET /v2/sales/{PaymentId}` para o status final.

## ECI (resumo)

| ECI | Significado |
|---|---|
| 05 | Visa/Discover autenticado completo |
| 06 | Visa autenticado parcialmente (tentativa) |
| 02 | Mastercard autenticado completo |
| 01 | Mastercard autenticado parcialmente |
| 07 | Visa sem autenticação |
| 00 | Mastercard sem autenticação |

Tabela completa: `https://docs.cielo.com.br/gateway/docs/tabela-de-eci.md`.

## 3DS no crédito (opcional)

Mesmo formato de `ExternalAuthentication` + `Payment.Authenticate=true`. Reduz chargeback (liability shift) mas pode reduzir aprovação se forçar desafio.

## Data Only

`ExternalAuthentication.DataOnly = true` envia dados de autenticação sem desafio. Útil para Visa Data Only. Veja `https://docs.cielo.com.br/gateway/docs/data-only.md`.
