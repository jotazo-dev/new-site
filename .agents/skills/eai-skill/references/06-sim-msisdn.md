# SIM Cards e MSISDNs

> Endpoints da API EAÍ Zion ERP. Base prod: `https://api.eai.net.br` · BasePath: `/api`

### `GET /api/rest/service_eai/mvno_sim_card`

**Read all mvno sim cards**

`operationId`: `EaiService_ReadAllMvnoSimCards`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `pagination.page` (query) | integer | False | Page number |
| `pagination.limit` (query) | integer | False | Rows per page |
| `useIndex` (query) | boolean | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadAllMvnoSimCardsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/reserve_msisdns`

**Reservar lista de números para escolha do usuário na ativação**

`operationId`: `EaiService_TemporaryReserveMsisdns`

**Request body**

Schema: `v1eaiTemporaryReserveMsisdnsRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| DDD | string | False | string DDI = 1; |
| currentToken | string | False |  |
| types | v1eaiTemporaryReserveMsisdnsRequestType[] | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiTemporaryReserveMsisdnsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---
