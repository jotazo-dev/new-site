# Cartões e cenários de teste (Sandbox / Provider "Simulado")

Doc: `https://docs.cielo.com.br/gateway/reference/cartoes-para-teste-simulado.md`

Para usar estes cartões no sandbox, envie `Payment.Provider = "Simulado"`.

| Cenário | CardNumber | ProviderReturnCode | Mensagem |
|---|---|---|---|
| Autorizado | `0000000000000000` / `0000000000000001` / `0000000000000004` | 6 | Operação realizada com sucesso |
| Não autorizado | `0000000000000002` | 05 | Não Autorizada |
| Cartão expirado | `0000000000000003` | 57 | Cartão Expirado |
| Cartão bloqueado | `0000000000000005` | 78 | Cartão Bloqueado |
| Time out | `0000000000000006` | 99 | Time Out |
| Cartão cancelado | `0000000000000007` | 77 | Cartão Cancelado |
| Problemas | `0000000000000008` | 70 | Problemas com Cartão |
| Aleatório (6 ou 9) | `0000000000000009` | 6/9 | Sucesso ou Timeout |

`SecurityCode` qualquer 3 dígitos; `ExpirationDate` qualquer `MM/YYYY` futura. Sem pontos no PAN.

## Para cenários reais com Mod10 / VerifyCard / Cartão Protegido

Use geradores de cartão fictício que obedeçam Luhn (ex.: bandeiras Visa `4444333322221111`, Master `5555444433331111`). Em sandbox `Cielo30`/`Cielo` aceita esses BINs.

## Boleto sandbox

`Payment.Provider = "Simulado"`. Não gera boleto real, mas devolve `Url` mock e `DigitableLine` fictícia. Status pode ser alterado manualmente via painel sandbox.

## Pix sandbox

A nova integração `Cielo2` **não tem sandbox**. Para testar fluxo de geração de QR Code, usar provider antigo (`Cielo30`) apenas em desenvolvimento da UI. Para validar real, fazer transação de R$ 0,01 em produção.

## 3DS sandbox

Lista de cartões 3DS de teste: `https://docs.cielo.com.br/gateway/docs/cartoes-teste-3ds.md`. Cobre cenários frictionless, challenge OTP, falha de autenticação.

## Postman

Cielo publica collection oficial — ver `https://docs.cielo.com.br/gateway/page/sandbox-gateway` e `https://docs.cielo.com.br/ecommerce-cielo/reference/postman.md`.
