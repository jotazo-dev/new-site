# MVNO Carts (Ativação / Recarga)

> Endpoints da API EAÍ Zion ERP. Base prod: `https://api.eai.net.br` · BasePath: `/api`

### `GET /api/rest/service_eai/mvno_carts`

**Read all mvno carts**

`operationId`: `EaiService_ReadAllMvnoCarts`

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
| `personId` (query) | string | False |  |
| `status` (query) | array | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadAllMvnoCartsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_carts`

**Create a new Mvno Cart**

`operationId`: `EaiService_CreateMvnoCart`

**Request body**

Schema: `eaiCreateMvnoCartRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| activation | CreateMvnoCartRequestActivation | False |  |
| billingType | eaiBillingType | False | - btExternalPayment: cobrança externa, ex: cobrado do cliente por um ERP de terceiros  - btInternalPayment: cobrança por contrato |
| cartType | eaiMvnoCartType | False |  |
| origin | eaiMvnoCartOrigin | False |  |
| personId | string (uint64) | False |  |
| planId | string (uint64) | False |  |
| portability | eaiCreateMvnoCartRequestPortability | False |  |
| promotionId | string (uint64) | False |  |
| recharge | CreateMvnoCartRequestRecharge | False |  |
| recurrence | eaiCreateMvnoCartRequestRecurrence | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiCreateMvnoCartResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_carts/available_ddds`

**Return list of available Msisdn DDD's**

`operationId`: `EaiService_GetAvailableMsisdnDDDs`

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiGetAvailableMsisdnDDDsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `DELETE /api/rest/service_eai/mvno_carts/{cartId}`

**Cancel a pending Mvno Cart**

`operationId`: `EaiService_CancelMvnoCart`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `cartId` (path) | string | True |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiCancelMvnoCartResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `PATCH /api/rest/service_eai/mvno_carts/{cartId}`

**Process a Mvno Cart**

`operationId`: `EaiService_ProcessMvnoCart`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `cartId` (path) | string | True |  |

**Request body**

Schema: `EaiServiceProcessMvnoCartBody`

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiProcessMvnoCartResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `PATCH /api/rest/service_eai/mvno_carts/{cartId}/bind_nfcom_chave_local`

**Bind NFCom chave local to a Mvno Cart**

`operationId`: `EaiService_BindMvnoCartNfcomChaveLocal`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `cartId` (path) | string | True |  |

**Request body**

Schema: `EaiServiceBindMvnoCartNfcomChaveLocalBody`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| nfcomChaveLocal | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiBindMvnoCartNfcomChaveLocalResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---
