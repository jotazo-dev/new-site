# Customers & Cards (cofre)

Para salvar cartão e cobrar depois sem pedir número novamente.

## Customers
- `POST /v1/customers` `{ "email":"x@y.com", "first_name":"", "last_name":"", "identification":{...} }`
- `GET  /v1/customers/{id}`
- `GET  /v1/customers/search?email=x@y.com`
- `PUT  /v1/customers/{id}`

## Cards
- `POST /v1/customers/{customer_id}/cards` `{ "token":"<card_token>" }`
- `GET  /v1/customers/{customer_id}/cards`
- `GET  /v1/customers/{customer_id}/cards/{card_id}`
- `DELETE /v1/customers/{customer_id}/cards/{card_id}`

## Cobrar com cartão salvo

1. Frontend gera novo token apenas com `cardId` + CVV via SDK:
```js
mp.fields.createCardToken({ cardId: "<card_id>", securityCode: "123" })
```
2. Backend chama `/v1/payments` com esse token + `payer.type:"customer"` + `payer.id:"<customer_id>"`.

CVV nunca é armazenado; é exigido a cada cobrança (exceto subscriptions com `card_token_id`).
