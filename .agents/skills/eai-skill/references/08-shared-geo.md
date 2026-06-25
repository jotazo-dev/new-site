# Shared: Cidades / Estados / Países

> Endpoints da API EAÍ Zion ERP. Base prod: `https://api.eai.net.br` · BasePath: `/api`

### `GET /api/rest/service_shared/cities`

**Read all cities**

`operationId`: `SharedService_GetAllCitiesOptions`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `uf` (query) | string | False |  |
| `id` (query) | string | False |  |
| `name` (query) | string | False |  |
| `ibge` (query) | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1sharedGetAllCitiesOptionsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_shared/cities/{ibge}`

**Read city by IBGE code.**

`operationId`: `SharedService_GetCityByIbge`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `ibge` (path) | string | True |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | sharedGetCityByIbgeResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_shared/countries`

**Read all countries**

`operationId`: `SharedService_GetAllCountriesOptions`

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | sharedGetAllCountriesOptionsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_shared/states`

**Read all states**

`operationId`: `SharedService_GetAllStatesOptions`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `countryId` (query) | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1sharedGetAllStatesOptionsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---
