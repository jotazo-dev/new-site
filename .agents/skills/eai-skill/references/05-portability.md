# Portabilidade

> Endpoints da API EAÍ Zion ERP. Base prod: `https://api.eai.net.br` · BasePath: `/api`

### `GET /api/rest/service_eai/mvno_portabilities`

**Read all mvno Portabilities**

`operationId`: `EaiService_ReadAllMvnoPortabilities`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `pagination.page` (query) | integer | False | Page number |
| `pagination.limit` (query) | integer | False | Rows per page |
| `document` (query) | string | False |  |
| `msisdn` (query) | string | False |  |
| `generic` (query) | string | False |  |
| `portedMsisdn` (query) | string | False |  |
| `status` (query) | array | False |  |
| `request` (query) | string | False |  |
| `forecast` (query) | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadAllMvnoPortabilitiesResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_portabilities`

**Create a new mvno Portability**

`operationId`: `EaiService_CreateMvnoPortability`

**Request body**

Schema: `v1eaiCreateMvnoPortabilityRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| lineId | string | False |  |
| portedMsisdn | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiCreateMvnoPortabilityResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_portabilities/{id}`

**Read mvno Portability by Id**

`operationId`: `EaiService_ReadMvnoPortability`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` (path) | string | True |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadMvnoPortabilityResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_portabilities/{id}/history`

**Read mvno Portability history**

`operationId`: `EaiService_ReadAllMvnoPortabilityHistory`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` (path) | string | True |  |
| `pagination.page` (query) | integer | False | Page number |
| `pagination.limit` (query) | integer | False | Rows per page |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadAllMvnoPortabilityHistoryResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_portability_status_by_line/{lineId}`

**Read mvno Portability status by line**

`operationId`: `EaiService_ReadMvnoPortabilityStatusByLine`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `lineId` (path) | string | True |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadMvnoPortabilityStatusByLineResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---
