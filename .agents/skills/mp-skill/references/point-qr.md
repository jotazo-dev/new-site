# In-Store: QR Code + Point

## QR Code (cliente lê QR no app MP)

`user_id` = collector_id (`GET /users/me`); `external_pos_id` = id do PDV criado por você.

- `POST /stores` / `GET /users/{user_id}/stores`
- `POST /pos` / `GET /pos` / `PUT /pos/{id}` / `DELETE /pos/{id}`
- `PUT /instore/orders/qr/seller/collectors/{user_id}/pos/{ext_pos_id}/qrs` — QR fixo
- `PUT /instore/qr/seller/collectors/{user_id}/pos/{ext_pos_id}/orders` — QR dinâmico (valor)
- `DELETE /instore/qr/seller/collectors/{user_id}/pos/{ext_pos_id}/orders` — limpa intent atual

## Point (maquininha física)

- `GET  /point/integration-api/devices?store_id=&pos_id=` — devices pareados
- `POST /point/integration-api/devices/{device_id}/payment-intents`
  ```json
  { "amount": 1500, "description":"Pedido X",
    "payment":{"installments":1,"type":"credit_card","installments_cost":"seller"},
    "additional_info":{"external_reference":"<order_id>","print_on_terminal":true,"ticket_number":"123"} }
  ```
- `GET  /point/integration-api/payment-intents/{id}` — status (`OPEN`, `ON_TERMINAL`, `PROCESSED`, `CANCELED`, `REVERSED`)
- `DELETE /point/integration-api/devices/{device_id}/payment-intents/{intent_id}` — cancela
- `GET  /point/integration-api/payment-intents/events` — últimos eventos
- `PATCH /point/integration-api/devices/{device_id}` `{ "operating_mode": "PDV" | "STANDALONE" }`

Webhook tópico: `point_integration_wh`.
