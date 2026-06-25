# Tratamento de erros, retries e idempotência

## Formato de erro padrão

Todas as respostas de erro seguem o formato `googlerpc.Status`:

```json
{
  "code": 3,
  "message": "Plan is not valid for this finality",
  "details": [
    { "@type": "type.googleapis.com/...", "field": "...", "reason": "..." }
  ]
}
```

`code` segue os códigos canônicos do gRPC:

| code | HTTP equivalente | Significado |
|---|---|---|
| 0 | 200 | OK |
| 3 | 400 | INVALID_ARGUMENT (validação) |
| 5 | 404 | NOT_FOUND |
| 6 | 409 | ALREADY_EXISTS |
| 7 | 403 | PERMISSION_DENIED |
| 8 | 429 | RESOURCE_EXHAUSTED (rate limit) |
| 9 | 400 | FAILED_PRECONDITION (cart já processado, linha cancelada etc.) |
| 13 | 500 | INTERNAL |
| 14 | 503 | UNAVAILABLE (operadora fora do ar) |
| 16 | 401 | UNAUTHENTICATED (renovar OAuth) |

## Quando retentar

| Situação | Retry? | Notas |
|---|---|---|
| HTTP 401 | sim, 1x | Renove o `access_token` antes |
| HTTP 429 | sim, com backoff | `Retry-After` se presente, senão 2s/4s/8s |
| HTTP 502/503/504 | sim, 2x | Backoff exponencial |
| HTTP 5xx em `POST /mvno_carts` | **não automaticamente** | Idempotência não é garantida — consulte `GET /mvno_carts` antes para checar se criou |
| HTTP 5xx em `PATCH /mvno_carts/{id}` (processar) | **não automaticamente** | Mesma razão; processar 2x pode duplicar cobrança |
| HTTP 5xx em GETs | sim, 2x | Idempotente por natureza |

## Idempotência

A API **não expõe header `Idempotency-Key`**. Para operações com efeito financeiro (`POST /mvno_carts`, `PATCH /mvno_carts/{id}`, `POST /mvno_lines/{lineId}/post_paid`) o cliente deve:

1. Gerar um identificador próprio e armazenar antes do POST.
2. Após timeout/erro, **listar via GET** filtrando por esse identificador (ex.: `metadata` do cart) antes de tentar de novo.
3. Registrar o `cart_id` retornado assim que houver 2xx — para nunca repetir o POST do mesmo carrinho.

## Webhooks de entrada

Os webhooks `webhook_nfcom_cobilling*` recebidos da EAÍ devem ser respondidos com 2xx rapidamente; processamento pesado deve ir para fila/background.
