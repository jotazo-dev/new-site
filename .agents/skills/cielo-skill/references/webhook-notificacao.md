# Webhook — Post de Notificação

Doc oficial: `https://docs.cielo.com.br/gateway/reference/notificacao-enviada.md`

## Configuração

Cadastrar **URL de Notificação** via Atendimento Cielo (chamado). Requisitos:

- **HTTPS** obrigatório, porta 443 (não usar portas custom).
- Endpoint **público** (sem auth básica/JWT — Cielo não envia headers de auth).
- Deve retornar `HTTP 200 OK`. Qualquer outro código → Cielo tentará reenviar.

## Payload

```json
{
  "PaymentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ChangeType": 2
}
```

Recorrência:
```json
{
  "RecurrentPaymentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "PaymentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ChangeType": 2
}
```

## ChangeType

| Code | Descrição |
|---|---|
| 1 | Mudança de status da transação (consultar GET) |
| 2 | Recorrência criada |
| 3 | Mudança de status do antifraude |
| 4 | Mudança de status do pagamento recorrente (ex.: desativação automática) |
| 5 | Estorno negado (Rede) |
| 6 | Boleto pago a menor |
| 7 | Notificação de chargeback (legado — Risk Notification) |
| 8 | Alerta de fraude |
| 25 | Cancelamento/estorno parcial |

## Boas práticas no handler

1. **Idempotência**: salvar `PaymentId+ChangeType+timestamp` e ignorar duplicatas.
2. Responder `200` rápido — depois disparar processamento async.
3. **Sempre re-consultar** `GET /v2/sales/{PaymentId}` no host de consulta para obter o estado atual (o webhook só sinaliza que mudou).
4. Logar payload bruto para auditoria.
5. Como o webhook pode falhar, rodar **sondagem agendada** das transações pendentes do dia.
6. Sem assinatura/HMAC — validar pelo `PaymentId` (consulta GET autenticada). Não confiar cegamente no corpo.

## Segurança

Como o endpoint é público, **nunca** liberar ações sensíveis só com base no corpo do webhook. Confirme estado via GET autenticado antes de marcar pagamento como aprovado, enviar produto, ativar assinatura.
