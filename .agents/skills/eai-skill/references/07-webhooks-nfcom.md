# Webhooks NFCom

> Endpoints da API EAÍ Zion ERP. Base prod: `https://api.eai.net.br` · BasePath: `/api`

### `POST /api/rest/service_eai/webhook_nfcom_cobilling`

**Webhook NFCOM Cobilling**

`operationId`: `EaiService_WebhookNfcomCobilling`

**Request body**

Schema: `eaiWebhookNfcomCobillingRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| chave_acesso | string | False |  |
| cnpj_emitente | string | False |  |
| cpf_cnpj | string | False |  |
| data_emissao | string (date-time) | False |  |
| evento | string | False |  |
| itens | eaiWebhookNfcomCobillingItem[] | False |  |
| nome_cliente | string | False |  |
| referencia_boleto | string | False |  |
| vencimento_boleto | string (date-time) | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiWebhookNfcomCobillingResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/webhook_nfcom_cobilling_voalle`

**Webhook NFCOM Cobilling Voalle**

`operationId`: `EaiService_WebhookNfcomCobillingVoalle`

**Request body**

Schema: `eaiWebhookNfcomCobillingVoalleRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| AccessKey | string | False | Chave de acesso do documento fiscal gerado |
| Amount | number (double) | False | Valor do item |
| Competence | string | False | Competencia |
| DocumentNumber | integer (int64) | False | Número do documento |
| Id | string | False | Identificador da emissão de terceiros/co-faturamento no elleven |
| IntegrationCode | string | False |  |
| IssueDate | string | False | Data de emissão do documento |
| Person | eaiWebhookNfcomCobillingVoalleRequestPerson | False |  |
| Serie | string | False | Série |
| Status | integer (int64) | False | Status do documento fiscal. 1 = Autorizado ou 9= Cancelado |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiWebhookNfcomCobillingVoalleResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---
