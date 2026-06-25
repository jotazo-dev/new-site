# MVNO Lines (Linhas Ativas)

> Endpoints da API EAÍ Zion ERP. Base prod: `https://api.eai.net.br` · BasePath: `/api`

### `GET /api/rest/service_eai/mvno_lines`

**Read all mvno Lines**

`operationId`: `EaiService_ReadAllMvnoLines`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `pagination.page` (query) | integer | False | Page number |
| `pagination.limit` (query) | integer | False | Rows per page |
| `document` (query) | string | False |  |
| `msisdn` (query) | string | False |  |
| `iccid` (query) | string | False |  |
| `createdAt.start` (query) | string | False |  |
| `createdAt.end` (query) | string | False |  |
| `imsi` (query) | string | False |  |
| `personId` (query) | string | False |  |
| `onlyActive` (query) | boolean | False |  |
| `status` (query) | array | False |  |
| `forceResellerFilter` (query) | boolean | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiReadAllMvnoLinesResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_lines/bulk_consumption`

**Read bulk mvno line consumption**

`operationId`: `EaiService_ReadBulkMvnoLineConsumption`

**Request body**

Schema: `eaiReadBulkMvnoLineConsumptionRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| dateInitials | string (date-time) | False |  |
| msisdn | string[] | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadBulkMvnoLineConsumptionResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_lines/{id}`

**Read mvno line by Id**

`operationId`: `EaiService_ReadMvnoLine`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` (path) | string | True |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiReadMvnoLineResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_lines/{lineId}/consumption`

**Get mvno line consumption**

`operationId`: `EaiService_ReadMvnoLineConsumption`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `lineId` (path) | string | True |  |
| `dateInitials` (query) | string | False |  |
| `dateFinal` (query) | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiReadMvnoLineConsumptionResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_lines/{lineId}/detailed_consumption`

**Read mvno line detailed consumption**

`operationId`: `EaiService_ReadMvnoLineDetailedConsumption`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `lineId` (path) | string | True |  |
| `dateInitials` (query) | string | False |  |
| `dateFinal` (query) | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiReadMvnoLineDetailedConsumptionResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_lines/{lineId}/post_paid`

**Get mvno line post paid**

`operationId`: `EaiService_ReadMvnoLinePostPaid`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `lineId` (path) | string | True |  |
| `onlyPending` (query) | boolean | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadMvnoLinePostPaidResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_lines/{lineId}/post_paid`

**Pay mvno line post paid**

`operationId`: `EaiService_PayMvnoLinePostPaid`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `lineId` (path) | string | True |  |

**Request body**

Schema: `EaiServicePayMvnoLinePostPaidBody`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| value | number (double) | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiPayMvnoLinePostPaidResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_lines/{lineId}/recurrence`

**Update Line recurrence**

`operationId`: `EaiService_ChangeMvnoLineRecurrence`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `lineId` (path) | string | True |  |

**Request body**

Schema: `eaiEaiServiceChangeMvnoLineRecurrenceBody`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| dueDay | integer (int64) | False |  |
| imediateUpgradeBillingType | eaiBillingType | False | - btExternalPayment: cobrança externa, ex: cobrado do cliente por um ERP de terceiros  - btInternalPayment: cobrança por contrato |
| paymentMethodType | commonPaymentMethodType | False |  |
| planId | string (uint64) | False |  |
| recurrence | eaiMvnoLineRecurrence | False |  |
| runImediateUpgrade | boolean | False |  |
| savedCardId | string (uint64) | False |  |
| suspend | boolean | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiChangeMvnoLineRecurrenceResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_lines/{lineId}/sim_card_exchange`

**Sim Card exchange**

`operationId`: `EaiService_MvnoLineSimCardExchange`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `lineId` (path) | string | True |  |

**Request body**

Schema: `EaiServiceMvnoLineSimCardExchangeBody`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| newIccid | string | False |  |
| randomESim | boolean | False |  |
| reason | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiMvnoLineSimCardExchangeResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---
