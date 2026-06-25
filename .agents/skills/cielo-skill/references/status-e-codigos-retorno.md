# Status, ReasonCode, ProviderReturnCode

## Status da transação (`Payment.Status`)

Doc: `https://docs.cielo.com.br/gateway/reference/status.md`

| Code | Nome | Meio | Significado |
|---|---|---|---|
| 0 | NotFinished | Todos | Falha de processamento, dados inválidos, timeout, ou abandono (débito) |
| 1 | Authorized | Todos | Crédito: aprovado, aguardando captura. Boleto: gerado. |
| 2 | PaymentConfirmed | Todos | Pago e finalizado |
| 3 | Denied | Cartões + e-wallets | Negado pelo emissor — ver `ProviderReturnCode` |
| 10 | Voided | Tudo menos boleto/Pix | Cancelado no mesmo dia |
| 11 | Refunded | Cartões + e-wallets + Pix | Estornado em dia posterior. Pix devolução total = sempre 11 |
| 12 | Pending | Cartões débito + e-wallets + Pix | Aguardando confirmação do banco/PSP |
| 13 | Aborted | – | Abortado por antifraude/validação |
| 20 | Scheduled | Recorrência | Agendado |

## ReasonCode / ReasonMessage

Doc: `https://docs.cielo.com.br/gateway/reference/lista-de-reasoncodereasonmessage.md`

Indicam o resultado dos fluxos internos Cielo↔adquirente (especialmente em **captura, cancelamento, boleto**).

| Code | Mensagem |
|---|---|
| 00 | Successful |
| 01 | AffiliationNotFound |
| 02 | InsufficientFunds |
| 03 | CouldNotGetCreditCard |
| 04 | ConnectionWithAcquirerFailed |
| 05 | InvalidTransactionType |
| 06 | InvalidPaymentPlan |
| 07 | Denied |
| 08 | Scheduled |
| 09 | Waiting |
| 10 | Authenticated |
| 11 | NotAuthenticated |
| 12 | ProblemsWithCreditCard |
| 13 | CardCanceled |
| 14 | BlockedCreditCard |
| 15 | CardExpired |
| 16 | AbortedByFraud |
| 17 | CouldNotAntifraud |
| 18 | TryAgain |
| 19 | InvalidAmount |
| 20 | ProblemsWithIssuer |
| 21 | InvalidCardNumber |
| 22 | TimeOut |
| 23 | CartaoProtegidoIsNotEnabled |
| 24 | PaymentMethodIsNotEnabled |
| 25 | CouldNotFindPaymentToken |
| 26 | MerchantIdJustClickNotFound |
| 27 | BrandNotSupported |
| 28 | CardOptionsNotSupported |
| 29 | WalletKeyIsInvalid |
| 30 | MerchantWalletConfigurationNotFound |
| 31 | BoletoRequiredDataNotSupported |
| 32 | ConnectionWithAntifraudFailed |
| 33 | AbortedByCardVerification |
| 34 | ProblemsWithAcquirer |
| 35 | ValidationError |
| 36 | AcquirerTransactionNotFound |
| 37 | SplitTransactionalError |
| 38 | MerchantSplitConfigurationNotFound |
| 42 | ProviderNotFound |
| 43 | PaymentSettingsNotFound |
| 98 | InvalidRequest |
| 99 | InternalError |

## ProviderReturnCode

Código devolvido pela **adquirente/emissor**. Tabela varia por provider:

- Cielo: `https://docs.cielo.com.br/atendimento/docs/códigos-de-retorno-cielo.md`
- Rede: códigos próprios (00 = autorizado).
- FirstData: `https://docs.cielo.com.br/atendimento/docs/código-de-retorno-firstdata.md`.
- SafraPay: códigos próprios (00 = autorizado, 79 = erro de configuração).

Códigos genéricos comuns: `00`/`4`/`6` = aprovado, `05` = negada, `51` = sem saldo, `54` = expirado, `57` = não permitida, `78` = bloqueado, `82`/`83` = CVV inválido, `99` = timeout.

## HTTP Status

Doc: `https://docs.cielo.com.br/gateway/reference/lista-de-http-status-code.md`

| HTTP | Significado |
|---|---|
| 201 | Created (POST `/v2/sales/`) |
| 200 | OK (PUT/GET) |
| 400 | Validação falhou → corpo `[{ Code, Message }]` |
| 401 | MerchantId/MerchantKey inválidos |
| 404 | Recurso/PaymentId não encontrado |
| 422 | Regra de negócio violada |
| 500 | Erro interno Cielo — re-tentar |
