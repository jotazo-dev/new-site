---
name: cielo-skill
description: Integração completa com o Cielo Gateway de Pagamento (API REST Braspag). Use sempre que o usuário pedir para integrar Cielo, criar checkout/pagamento Cielo, gerar QR Code Pix Cielo, emitir boleto registrado via Cielo, processar cartão de crédito ou débito Cielo, tokenizar cartão (Cartão Protegido), capturar/cancelar/estornar transação, configurar recorrência programada, autenticação 3DS 2.2, ou tratar notificações (webhook) e códigos de retorno (Status, ReasonCode, ProviderReturnCode) do Gateway de Pagamento Cielo / Braspag (apisandbox.braspag.com.br e api.braspag.com.br). Cobre headers MerchantId/MerchantKey, sandbox vs produção, payloads e fluxos por meio de pagamento.
---

# Cielo Gateway de Pagamento (Braspag) — Skill

Esta skill resume a integração com o **Cielo Gateway de Pagamento** (também conhecido como Braspag/Cielo 3.0). É uma API **REST + JSON**, sem SDK proprietário. Autenticação por dois headers (`MerchantId`, `MerchantKey`). Mesmo endpoint base (`/v2/sales/`) processa cartão de crédito, débito, boleto, Pix e voucher — o que muda é o conteúdo do nó `Payment`.

> **Importante**: Há duas APIs distintas da Cielo. Esta skill cobre o **Gateway de Pagamento** (host `*.braspag.com.br`, segmentado por loja/integrador, recorrência server-side, multi-adquirente). A **API E-commerce Cielo** (host `*.cieloecommerce.cielo.com.br`) é outra integração; se o usuário pedir essa, alerte e confirme.

## URLs base

| Ambiente | Transacional | Consulta |
|---|---|---|
| Sandbox | `https://apisandbox.braspag.com.br` | `https://apiquerysandbox.braspag.com.br` |
| Produção | `https://api.braspag.com.br` | `https://apiquery.braspag.com.br` |

> Pix com `Provider: Cielo2` (nova integração obrigatória desde 01/10) **não tem sandbox** — testar em produção com valor baixo.

## Headers obrigatórios (toda requisição)

```http
Content-Type: application/json
MerchantId: <GUID 36>
MerchantKey: <string 40>
RequestId: <GUID opcional, recomendado p/ idempotência/log>
```

- `MerchantId`: identificador da loja (GUID). Em geral o mesmo em sandbox e produção.
- `MerchantKey`: chave secreta — **diferente** entre sandbox e produção. Nunca expor no front. Manter em segredo (`add_secret`).
- Credenciais públicas de teste do sandbox aparecem nos exemplos da doc: `MerchantId=e3c24810-18bb-4bd7-88a0-a36d6b4a0731`, `MerchantKey=GQUAIWVDKUINZRHDQPLHUVHAIIFEIXFEXWPOYGHY`.

## Métodos HTTP

| Método | Uso |
|---|---|
| `POST /v2/sales/` | Criar transação (crédito, débito, boleto, Pix, voucher…). |
| `PUT /v2/sales/{PaymentId}/capture` | Captura posterior (crédito). Aceita `?amount=` p/ captura parcial. |
| `PUT /v2/sales/{PaymentId}/void` | Cancelamento/estorno. Aceita `?amount=` p/ parcial. |
| `GET /v2/sales/{PaymentId}` (host de consulta) | Consultar transação. |
| `GET /v2/sales?merchantOrderId=X` | Listar transações de um pedido. |
| `GET /v2/sales/{RecurrentPaymentId}/RecurrentPayment` | Consultar recorrência. |
| `DELETE /v2/sales/Pix/{PaymentId}` (Cielo2) | Remover QR Code Pix. |
| `POST /v2/sales/{PaymentId}/void` (Pix) | Devolução total/parcial Pix. |

## Fluxo padrão

```
POST /v2/sales/   → Status=1 (Authorized) ou 12 (Pending)
            ↓
   PUT capture (se cartão crédito não auto-capturado) → Status=2 (PaymentConfirmed)
            ↓
   PUT void (cancelamento / estorno)                   → Status=10 (Voided) / 11 (Refunded)
```

Webhook (`POST` no `UrlNotification` cadastrada) avisa toda mudança de status.

## Meios de pagamento suportados (mapa rápido)

| Meio | `Payment.Type` | `Payment.Provider` (principal) | Detalhes |
|---|---|---|---|
| Cartão de crédito | `CreditCard` | `Cielo`, `Cielo30`, `Rede`, `Getnet`, `FirstData`, `SafraPay`, `Simulado` (sandbox) | Auth, captura, parcelamento loja/emissor, 3DS opcional |
| Cartão de débito | `DebitCard` | `Cielo`, `Cielo30`, `Rede` | **3DS 2.2 obrigatório** + redirect/desafio |
| Boleto registrado | `Boleto` | `Bradesco2`, `BancoDoBrasil3`, `Itau3`, `Santander2`, `Citibank2`, `Simulado` (sandbox) | Regras de tamanho por banco |
| Pix | `Pix` | `Cielo2` (nova), `BBPix` (BB), Bradesco | Retorna `QrCodeBase64Image` + `QrCodeString` |
| QR Code | `QRCode` | `Cielo` | Pagamento via Cielo QR (cartão) |
| Voucher Alelo | `Voucher` | `Alelo` | Sem cancelamento parcial |
| Cartão multibenefícios | `CreditCard` (flag) | `Cielo` | Benefícios |
| Apple/Google/Samsung Pay | `CreditCard` + `Wallet` | `Cielo` | Wallet criptografado |
| BNPL (Koin) | `Koin` | `Koin` | Buy Now Pay Later |
| SDWO / Pedágio / P2P / Me2Me | vários | `Cielo` | Transferências |

## Status de transação (resumo)

| Code | Status | Significado |
|---|---|---|
| 0 | NotFinished | Falha de processamento ou abandono |
| 1 | Authorized | Aguardando captura (crédito) ou aguardando pagamento (boleto) |
| 2 | PaymentConfirmed | Pago e finalizado |
| 3 | Denied | Negado pelo emissor |
| 10 | Voided | Cancelado no mesmo dia |
| 11 | Refunded | Estornado (após o dia da autorização) |
| 12 | Pending | Pix gerado / aguardando bank |
| 13 | Aborted | Abortado por antifraude/validação |

## Boas práticas

1. **Nunca trafegar PAN/CVV pelo front próprio** sem PCI — use **Silent Order Post** ou **Cartão Protegido** (tokenização).
2. Toda transação aprovada que **não foi capturada** expira (regra varia por adquirente). Capture imediatamente ou agende.
3. Webhook pode chegar fora de ordem ou perdido — sempre fazer **sondagem** (`GET /v2/sales/{PaymentId}`) das transações pendentes do dia.
4. Use `RequestId` (GUID) por request e log de `MerchantOrderId` + `PaymentId` + `ProofOfSale` (NSU) + `AuthorizationCode`.
5. `MerchantOrderId` repetido em 24h faz o gateway gerar `SentOrderId` diferente — não conte com unicidade.
6. Validar cartão com `Mod10` (Algoritmo de Luhn) antes de enviar.
7. Para **débito** SEMPRE rodar 3DS 2.2 antes da autorização.
8. Configurar `UrlNotification` HTTPS porta 443 no portal Cielo (via Atendimento).

## Índice de referências

| Tópico | Arquivo |
|---|---|
| URLs, headers, credenciais e arquitetura | `references/ambientes-e-autenticacao.md` |
| Cartão de crédito (payload completo + parcelamento + captura/cancel) | `references/cartao-credito.md` |
| Cartão de débito + 3DS 2.2 | `references/cartao-debito-3ds.md` |
| Boleto registrado (regras por banco) | `references/boleto.md` |
| Pix (Cielo2): gerar/consultar/devolver QR Code | `references/pix.md` |
| Recorrência programada e não programada | `references/recorrencia.md` |
| Cartão Protegido (tokenização) + VerifyCard | `references/tokenizacao-cartao-protegido.md` |
| Captura, cancelamento, estorno, consulta | `references/captura-cancelamento.md` |
| Webhook (Post de Notificação) | `references/webhook-notificacao.md` |
| Status, ReasonCode, ProviderReturnCode | `references/status-e-codigos-retorno.md` |
| Cartões e cenários de teste em sandbox | `references/cartoes-teste-sandbox.md` |
| Checklist de produção | `references/checklist-producao.md` |

Documentação oficial: `https://docs.cielo.com.br/gateway/docs/gateway` · índice em `https://docs.cielo.com.br/llms.txt`.
