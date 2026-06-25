# Catálogo: Planos e Produtos

> Endpoints da API EAÍ Zion ERP. Base prod: `https://api.eai.net.br` · BasePath: `/api`

### `GET /api/rest/service_eai/mvno_main_products`

**Read all mvno main products**

`operationId`: `EaiService_GetAllMainProducts`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `showInactive` (query) | boolean | False |  |
| `showOnlyAllowedForActivation` (query) | boolean | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiGetAllMainProductsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_plans`

**Read all mvno Plans**

`operationId`: `EaiService_ReadAllMvnoPlans`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `pagination.page` (query) | integer | False | Page number |
| `pagination.limit` (query) | integer | False | Rows per page |
| `listOnlyActive` (query) | boolean | False |  |
| `resellerPersonId` (query) | string | False |  |
| `name` (query) | string | False |  |
| `status` (query) | array | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiReadAllMvnoPlansResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_plans/possible_activation_plans`

**Read possible mvno activation plans**

`operationId`: `EaiService_ReadPossibleActivationMvnoPlans`

**Request body**

Schema: `eaiReadPossibleActivationMvnoPlansRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| listOnlyActive | boolean | False |  |
| listOnlyVisibleInCustomer | boolean | False |  |
| mvnoMainProductId | string (uint64) | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadPossibleActivationMvnoPlansResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_plans/possible_line_plans`

**Read possible mvno line plans**

`operationId`: `EaiService_ReadPossibleMvnoLinePlans`

**Request body**

Schema: `eaiReadPossibleMvnoLinePlansRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| finality | eaiMvnoPlanFinality | False | - mpfRecurrence: uso interno apenas |
| lineId | string | False |  |
| listOnlyActive | boolean | False |  |
| listOnlyVisibleInCustomer | boolean | False |  |
| resellerPersonId | string (uint64) | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiReadPossibleMvnoLinePlansResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/mvno_plans/valid`

**Check if mvno plan is valid**

`operationId`: `EaiService_IsValidMvnoPlan`

**Request body**

Schema: `eaiIsValidMvnoPlanRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| finality | eaiMvnoPlanFinality | False | - mpfRecurrence: uso interno apenas |
| lineId | string | False |  |
| planId | string (uint64) | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiIsValidMvnoPlanResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/mvno_plans/{id}`

**Read mvno plan by Id**

`operationId`: `EaiService_ReadMvnoPlan`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` (path) | string | True |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiReadMvnoPlanResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `DELETE /api/rest/service_eai/mvno_plans/{mvnoPlanId}`

**Delete reseller mvno plan**

`operationId`: `EaiService_DeleteResellerPlan`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `mvnoPlanId` (path) | string | True |  |
| `resellerPersonId` (query) | string | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiDeleteResellerPlanResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `PATCH /api/rest/service_eai/mvno_plans/{mvnoPlanId}`

**Update mvno plan reseller information**

`operationId`: `EaiService_UpdateResellerPlan`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `mvnoPlanId` (path) | string | True |  |

**Request body**

Schema: `EaiServiceUpdateResellerPlanBody`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| mvnoPlanResellerServices | eaiMvnoPlanResellerService[] | False |  |
| name | string | False |  |
| resellerPersonId | string (uint64) | False |  |
| serviceValue | number (double) | False |  |
| status | commonActiveInactive | False |  |
| visibleInCustomer | boolean | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiUpdateResellerPlanResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---
