# Checklist para subir em Produção

## Credenciais

- [ ] `MerchantId` de produção recebido por e-mail.
- [ ] `MerchantKey` de produção gerada no Portal E-commerce.
- [ ] Secrets armazenados via `add_secret`: `CIELO_MERCHANT_ID`, `CIELO_MERCHANT_KEY_PROD`, `CIELO_MERCHANT_KEY_SANDBOX`.
- [ ] Nenhum `MerchantKey` em código/front/log.

## Configuração na Cielo

- [ ] Adquirentes contratadas e afiliações cadastradas no portal Cielo (Cielo, Rede, Getnet…).
- [ ] Meios de pagamento contratados/habilitados (crédito, débito, boleto por banco, Pix Cielo2).
- [ ] URL de notificação cadastrada via chamado (HTTPS:443).
- [ ] Cartão Protegido habilitado se for usar tokenização/recorrência.
- [ ] Renova Fácil habilitado (opcional).
- [ ] Antifraude (Cybersource/ClearSale) contratado se aplicável.

## Implementação

- [ ] Trocar URLs sandbox → produção (`api.braspag.com.br` / `apiquery.braspag.com.br`).
- [ ] `Payment.Provider` real (Cielo30, Rede, Itau3, Cielo2…) em vez de `Simulado`.
- [ ] Validação Mod10 antes de POST de cartão.
- [ ] PAN/CVV nunca persistidos. Tokenizar via Cartão Protegido ou usar Silent Order Post.
- [ ] `RequestId` (GUID) único por chamada.
- [ ] `MerchantOrderId` único por pedido.
- [ ] Webhook handler idempotente + sondagem diária de pendentes.
- [ ] Logs com `PaymentId`, `Tid`, `ProofOfSale`, `AuthorizationCode`, `Status`, `ProviderReturnCode`.
- [ ] Tratamento de HTTP 400/401/422/500.
- [ ] Retentativa controlada para HTTP 500 e `ReasonCode=18 TryAgain`.

## Funcionalidades por meio

| Meio | Itens críticos |
|---|---|
| Crédito | Captura ≤ prazo do adquirente; cancelamento mesmo dia vs estorno; parcelamento loja/emissor |
| Débito | 3DS 2.2 obrigatório; redirect via `AuthenticationUrl`; `ReturnUrl` HTTPS |
| Boleto | Tamanhos por banco; `BoletoNumber` único; `ExpirationDate` futura |
| Pix Cielo2 | `Provider=Cielo2`; renderizar `QrCodeBase64Image` + `QrCodeString`; expiração configurada |
| Recorrência | `RecurrentPaymentId` armazenado; ajustes via `PUT /RecurrentPayment/...` |
| Tokenização | Token salvo por cliente; usar `CardToken` em vez de PAN |

## Segurança / PCI

- [ ] PCI SAQ-A (com Cartão Protegido + Silent Order Post) ou SAQ-D (se digitar cartão no servidor da loja).
- [ ] HTTPS em todo o fluxo, inclusive `ReturnUrl` e `UrlNotification`.
- [ ] LGPD: armazenar somente `MaskedNumber`, `Brand`, `Holder` (primeiro+último nome).
- [ ] Rate limit interno na rota que aciona o gateway.
- [ ] Antifraude para meios de risco (crédito > R$ X, sem 3DS).

## Operação

- [ ] Conciliação financeira diária por `MerchantOrderId` × `PaymentId` × `Status`.
- [ ] Conciliação Pix por `EndToEndId` e `txid`.
- [ ] Alertas em `Status=3 Denied`, `Status=11 Refunded`, falhas 5xx.
- [ ] Plano de contato Suporte E-commerce Cielo para reabertura de chamado/afiliação.
