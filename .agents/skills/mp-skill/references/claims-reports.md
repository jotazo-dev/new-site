# Pós-venda: Claims, Chargebacks, Reports

## Claims (reclamações do comprador)
- `GET /v1/claims/search?resource=payment&resource_id=<payment_id>`
- `GET /v1/claims/{id}`
- `POST /v1/claims/{id}/messages` — adiciona mensagem ao chat
- `POST /v1/claims/{id}/evidence` — anexa evidência (multipart)
- `PUT /v1/claims/{id}` — aceitar/rejeitar/oferta de reembolso

Status: `opened`, `closed`, `dispute`, `not_processed`.

## Chargebacks
- `GET /v1/chargebacks/{id}`
- `GET /v1/chargebacks/search?...`

Webhook: `chargebacks` / `claim`.

## Reports

### Settlement (liquidações)
- `POST /v1/account/settlement_report/config` — schedule (frequência, e-mails)
- `POST /v1/account/settlement_report` — geração sob demanda
- `GET  /v1/account/settlement_report/list`
- `GET  /v1/account/settlement_report/{filename}` — download CSV

### Released money
- `POST /v1/account/release_report` + `GET /v1/account/release_report/list`

CSV inclui taxas, MDR, retenções e liquidações por data.
