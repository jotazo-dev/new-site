# Sandbox & Test Cards (BR)

## Test users
Com `ACCESS_TOKEN` de **produção** do dono da aplicação:
```
POST /users/test_user
{ "site_id":"MLB", "description":"buyer" }
→ { id, nickname, password, email, site_status }
```
Crie ao menos um buyer e um seller; use o `access_token` do seller (gerado pelo painel do usuário de teste) para sandbox.

## Cartões de teste

| Bandeira | Número | CVV | Venc |
|---|---|---|---|
| Mastercard | 5031 4332 1540 6351 | 123 | 11/30 |
| Visa | 4235 6477 2802 5682 | 123 | 11/30 |
| Amex | 3753 651535 56885 | 1234 | 11/30 |
| Elo | 5067 7667 8388 8311 | 123 | 11/30 |
| Hipercard | 6062 8288 8866 8866 | 123 | 11/30 |

## Titulares para forçar resultado

| Nome | Resultado |
|---|---|
| `APRO` | aprovado |
| `OTHE` | recusado — erro geral |
| `CONT` | pendente |
| `CALL` | recusa — ligar para o emissor |
| `FUND` | saldo insuficiente |
| `SECU` | CVV inválido |
| `EXPI` | validade inválida |
| `FORM` | erro de formulário |

CPF de teste: `12345678909`.

## Pix sandbox
Aprovação automática em alguns minutos. Para forçar aprovação imediata em dev: aguardar webhook ou consultar `/v1/payments/{id}`.

## Boleto sandbox
Sempre fica `pending`. Para simular pagamento, use a API admin de sandbox (no painel test users → simular).
