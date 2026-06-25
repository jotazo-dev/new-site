# Orders API (`/v1/orders`)

Endpoint unificado mais novo. Um Order pode ter várias transactions (várias tentativas de pagamento) e suporta split nativo.

## Endpoints

| Método | Path |
|---|---|
| POST | `/v1/orders` (header `X-Idempotency-Key`) |
| GET  | `/v1/orders/{id}` |
| POST | `/v1/orders/{id}/process` |
| POST | `/v1/orders/{id}/capture` |
| POST | `/v1/orders/{id}/cancel` |
| POST | `/v1/orders/{id}/refund` |
| POST | `/v1/orders/{id}/transactions` |
| PUT  | `/v1/orders/{id}/transactions/{txId}` |
| DELETE | `/v1/orders/{id}/transactions/{txId}` |

## Tipos de Order
- `online` — fluxo padrão e-commerce
- `automatic` — recorrência/cobrança automática
- `manual` — sem captura automática (autorização)

## Campos importantes
- `external_reference` (correlação)
- `marketplace` / `marketplace_fee` (split)
- `transactions.payments[]` — cada attempt
- `total_amount`, `currency_id`
- `processing_mode` (`automatic` | `manual`)
- `capture_mode` (`automatic_async` | `manual`)

## Quando usar
Prefira `/v1/orders` se precisar de **múltiplas tentativas**, **split avançado**, ou **fluxo de marketplace**. Para o caso comum (1 pagamento por pedido), `/v1/payments` é suficiente e mais simples.
