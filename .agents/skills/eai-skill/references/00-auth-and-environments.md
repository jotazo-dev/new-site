# 00 — Autenticação e Ambientes

## URLs

| | Base URL | OAuth URL |
|---|---|---|
| **Produção** | `https://api.eai.net.br` | `https://api.eai.net.br/oauth2/token` |
| **Homologação** | `https://hml-mvno.eai.net.br` | `https://hml-mvno.eai.net.br/oauth2/token` |

Todos os endpoints REST ficam abaixo do basePath **`/api/`**. Exemplo completo:

```
https://api.eai.net.br/api/rest/service_eai/mvno_plans
```

## Fluxo OAuth2 — `client_credentials`

```http
POST /oauth2/token HTTP/1.1
Host: api.eai.net.br
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

**Resposta:**

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

> O token deve ser cacheado em memória até `expires_in - 60s`. Não renove a cada request.

### Exemplo curl

```bash
curl -s -X POST https://api.eai.net.br/oauth2/token \
  -u "$EAI_CLIENT_ID:$EAI_CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"
```

## Headers obrigatórios em cada chamada

| Header | Valor | Quando |
|---|---|---|
| `Authorization` | `Bearer <access_token>` | Sempre |
| `X-Company-Token` | Token da empresa revendedora | Sempre (operações de empresa) |
| `Content-Type` | `application/json` | POST/PATCH com body JSON |
| `Accept` | `application/json` | Recomendado |

> O `X-Company-Token` é fornecido pela EAÍ para cada revendedor/PJ. Em uma instalação multi-empresa, a credencial OAuth pode ser a mesma e o `X-Company-Token` muda por chamada.

## Filtros (`filter` query param)

A API usa filtros baseados em `commonFilterData`. O formato é um JSON serializado como string no query param `filter`.

### `commonSimpleFilterData`

```json
{ "field": "status", "operator": "EQUALS", "value": "ACTIVE" }
```

### `commonInFilterData`

```json
{ "field": "id", "operator": "IN", "values": ["uuid1", "uuid2"] }
```

### `commonGroupedFilterData`

```json
{
  "operator": "AND",
  "filters": [
    { "field": "status", "operator": "EQUALS", "value": "ACTIVE" },
    { "field": "created_at", "operator": "GTE", "value": "2026-01-01T00:00:00Z" }
  ]
}
```

### Operadores comuns (`commonFilterOperator`)

`EQUALS`, `NOT_EQUALS`, `GT`, `GTE`, `LT`, `LTE`, `LIKE`, `ILIKE`, `IN`, `NOT_IN`, `IS_NULL`, `IS_NOT_NULL`, `BETWEEN`. Consulte [`09-enums.md`](09-enums.md) para o conjunto exato exposto pelo swagger.

Uso:

```
GET /api/rest/service_eai/mvno_lines?filter=%7B%22field%22%3A%22status%22%2C%22operator%22%3A%22EQUALS%22%2C%22value%22%3A%22ACTIVE%22%7D&page=1&pageSize=50
```

## Paginação

Endpoints de listagem aceitam `page` (1-based) e `pageSize` (default 50, máx normalmente 100). A resposta inclui `metadata` (`commonPaginatedResponseMetadata`):

```json
{
  "data": [ ... ],
  "metadata": { "page": 1, "pageSize": 50, "total": 1342 }
}
```

## Ordenação

Em geral via query `orderBy=field:asc` ou `orderBy=field:desc`. Confira por endpoint no swagger se uma feature específica depender disto.

## Erros

Veja [`10-error-handling.md`](10-error-handling.md).
