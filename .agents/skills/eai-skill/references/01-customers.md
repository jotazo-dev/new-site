# Customers

> Endpoints da API EAÍ Zion ERP. Base prod: `https://api.eai.net.br` · BasePath: `/api`

### `GET /api/rest/service_eai/companies`

**Get companies**

`operationId`: `EaiService_GetCompanies`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `doNotGenToken` (query) | boolean | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiGetCompaniesResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/customers`

**Read all customers**

`operationId`: `EaiService_ReadAllCustomers`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `pagination.page` (query) | integer | False | Page number |
| `pagination.limit` (query) | integer | False | Rows per page |
| `useIndex` (query) | boolean | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiReadAllCustomersResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `POST /api/rest/service_eai/customers`

**Create a new customer**

`operationId`: `EaiService_CreateCustomer`

**Request body**

Schema: `v1eaiCreateCustomerRequest`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| addresses | eaiCreateCustomerRequestAddress[] | False |  |
| birthdate | string (date-time) | False |  |
| contacts | eaiCustomerContact[] | False |  |
| cpfCnpj | string | False |  |
| email | string | False |  |
| legalName | string | False |  |
| name | string | False |  |
| phone | string | False |  |
| rgIe | string | False |  |
| status | commonActiveInactive | False |  |
| type | commonPersonType | False | - Unknown: utilizado somente internamente na importação por planilha; não utilizar para salvar no banco |
| typeTelecom | commonPersonTypeTelecom | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiCreateCustomerResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/customers/check_already_exists/{cpfCnpj}`

**Check if customer already exists**

`operationId`: `EaiService_CustomerCheckAlreadyExists`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `cpfCnpj` (path) | string | True |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | eaiCustomerCheckAlreadyExistsResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `GET /api/rest/service_eai/customers/{id}`

**Read customer by Id**

`operationId`: `EaiService_ReadCustomer`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` (path) | string | True |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiReadCustomerResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---

### `PATCH /api/rest/service_eai/customers/{id}`

**Update customer**

`operationId`: `EaiService_UpdateCustomer`

**Parâmetros**

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` (path) | string | True |  |

**Request body**

Schema: `eaiEaiServiceUpdateCustomerBody`

| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| addresses | eaiUpdateCustomerRequestAddress[] | False |  |
| birthdate | string (date-time) | False |  |
| contacts | eaiCustomerContact[] | False |  |
| cpfCnpj | string | False |  |
| email | string | False |  |
| legalName | string | False |  |
| name | string | False |  |
| phone | string | False |  |
| rgIe | string | False |  |
| status | commonActiveInactive | False |  |
| type | commonPersonType | False | - Unknown: utilizado somente internamente na importação por planilha; não utilizar para salvar no banco |
| typeTelecom | commonPersonTypeTelecom | False |  |

**Respostas**

| Code | Schema | Descrição |
|---|---|---|
| 200 | v1eaiUpdateCustomerResponse | A successful response. |
| 400 | googlerpcStatus | Bad request |
| 401 | — | Unauthorized |
| 403 | — | Forbidden |
| 500 | googlerpcStatus | Internal Error |
| default | googlerpcStatus | An unexpected error response. |

---
