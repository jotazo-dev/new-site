---
name: asaas-skill
description: Integração com Asaas (API v3) em projetos Lovable com Supabase Edge Functions — cobranças Pix, boleto, cartão, assinaturas, splits, transferências e webhooks. Use ao criar, revisar ou corrigir fluxos de pagamento Asaas, configuração de secrets, modelagem de banco para clientes/pagamentos/eventos, ou recebimento seguro e idempotente de webhooks.
---


Use esta skill para criar, revisar ou corrigir integrações com Asaas em projetos Lovable, especialmente apps com Supabase, Edge Functions, banco de dados, pagamentos, Pix, boleto, cartão, assinaturas, splits, transferências e webhooks.

## Papel da skill

Atue como especialista em integração Asaas API v3. Ao implementar em Lovable, mantenha chaves, chamadas para Asaas, lógica de cobrança, criação de cliente, criação de pagamento, consulta de QR Code Pix, assinaturas, splits, transferências e webhooks sempre no backend.

Nunca exponha `ASAAS_API_KEY` no frontend. O frontend deve chamar apenas funções próprias do app, como Supabase Edge Functions.

## Workflow principal

1. Identifique o fluxo: pagamento avulso, Pix, boleto, cartão, assinatura, split, transferência, webhook ou sincronização de cliente.
2. Modele o estado local antes de chamar o Asaas.
3. Salve IDs retornados pelo Asaas, como `cus_...`, `pay_...`, `sub_...` e `evt_...`.
4. Configure ambiente sandbox e produção separadamente.
5. Faça todas as chamadas para o Asaas pelo backend.
6. Valide entrada do usuário no backend antes de criar cobrança, split ou transferência.
7. Implemente webhooks com autenticação, idempotência e resposta rápida `HTTP 200`.
8. Trate webhooks como fonte de verdade para status final de pagamento.

## Ambientes

Use variáveis separadas para sandbox e produção.

```env
ASAAS_ENV=sandbox
ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3
ASAAS_API_KEY=$aact_hmlg_xxxxxxxxxxxxxxxxx
ASAAS_WEBHOOK_AUTH_TOKEN=generate-a-secret-token
```

```env
ASAAS_ENV=production
ASAAS_BASE_URL=https://api.asaas.com/v3
ASAAS_API_KEY=$aact_prod_xxxxxxxxxxxxxxxxx
ASAAS_WEBHOOK_AUTH_TOKEN=generate-a-secret-token
```

Headers obrigatórios ou recomendados:

```http
Content-Type: application/json
User-Agent: your-application-name
access_token: ASAAS_API_KEY
```

## Segurança

- Guarde chaves apenas como secrets de backend.
- Nunca chame o Asaas diretamente pelo navegador.
- Nunca logue API keys, número completo de cartão, CVV, tokens de webhook ou headers de autorização.
- Use HTTPS e TLS 1.2 ou superior; prefira TLS 1.3.
- Faça rotação de chaves após vazamento, desligamento de colaborador ou atividade anormal.
- Use restrição por IP e webhook de autorização de transferência quando disponível.
- Valide todas as requisições do cliente contra ownership, preço e permissões no banco.
- Não aceite `value`, `customer`, `split`, `walletId`, dados bancários ou destino de transferência vindos do frontend sem conferência no banco.

## Modelo de banco recomendado

Clientes:

```sql
asaas_customer_id text unique
external_reference text
cpf_cnpj text
email text
phone text
```

Pagamentos:

```sql
asaas_payment_id text unique
asaas_customer_id text
external_reference text
billing_type text
status text
value numeric
due_date date
invoice_url text
bank_slip_url text
pix_payload text
pix_encoded_image text
raw_response jsonb
```

Eventos de webhook:

```sql
asaas_event_id text primary key
event_type text
object_id text
received_at timestamptz
processed_at timestamptz
payload jsonb
```

## Clientes

Criar cliente:

```http
POST /customers
```

Payload:

```json
{
  "name": "Marcelo Almeida",
  "cpfCnpj": "24971563792",
  "mobilePhone": "4799376637",
  "email": "cliente@email.com",
  "externalReference": "user_123"
}
```

Antes de criar duplicado, tente localizar:

```http
GET /customers?cpfCnpj=24971563792
GET /customers?externalReference=user_123
```

Salve o `id` retornado, por exemplo `cus_000005219613`.

## Cobranças avulsas

Criar boleto:

```http
POST /payments
```

```json
{
  "customer": "cus_000005219613",
  "billingType": "BOLETO",
  "value": 100.0,
  "dueDate": "2026-06-30",
  "description": "Pedido #123",
  "externalReference": "order_123"
}
```

Criar Pix:

```json
{
  "customer": "cus_000005219613",
  "billingType": "PIX",
  "value": 100.9,
  "dueDate": "2026-06-30",
  "description": "Pedido #123",
  "externalReference": "order_123"
}
```

Buscar QR Code Pix:

```http
GET /payments/{paymentId}/pixQrCode
```

Campos esperados:

```json
{
  "encodedImage": "base64-image",
  "payload": "pix-copia-e-cola",
  "expirationDate": "2026-06-30 23:59:59"
}
```

Criar cobrança com cartão:

```json
{
  "customer": "cus_000005219613",
  "billingType": "CREDIT_CARD",
  "value": 100.0,
  "dueDate": "2026-06-30",
  "description": "Pedido #123",
  "externalReference": "order_123",
  "creditCard": {
    "holderName": "Nome Impresso",
    "number": "5162306219378829",
    "expiryMonth": "05",
    "expiryYear": "2028",
    "ccv": "318"
  },
  "creditCardHolderInfo": {
    "name": "Nome Completo",
    "email": "cliente@email.com",
    "cpfCnpj": "24971563792",
    "postalCode": "89223-005",
    "addressNumber": "277",
    "phone": "4738010919",
    "mobilePhone": "47998781877"
  },
  "remoteIp": "customer-ip-address"
}
```

Regras:

- Calcule `value` no backend.
- Use `externalReference` para vincular ao pedido, usuário, fatura ou assinatura local.
- Não permita que o frontend escolha valor, destinatários de split, destino de transferência ou ownership do cliente.
- Persista URLs retornadas pelo Asaas, como invoice URL e bank slip URL, quando disponíveis.
- Evite trafegar dados de cartão quando checkout/tokenização atender ao caso.

## Assinaturas

Criar assinatura:

```http
POST /subscriptions
```

```json
{
  "customer": "cus_0T1mdomVMi39",
  "billingType": "BOLETO",
  "nextDueDate": "2026-07-15",
  "value": 19.9,
  "cycle": "MONTHLY",
  "description": "Plano Pro",
  "externalReference": "subscription_123"
}
```

Ciclos comuns:

```text
WEEKLY
BIWEEKLY
MONTHLY
QUARTERLY
SEMIANNUALLY
YEARLY
```

Listar cobranças de uma assinatura:

```http
GET /subscriptions/{subscriptionId}/payments
```

## Splits

Criar cobrança com split:

```json
{
  "customer": "cus_000005219613",
  "billingType": "PIX",
  "value": 100.0,
  "dueDate": "2026-06-30",
  "splits": [
    {
      "walletId": "48548710-9baa-4ec1-a11f-9010193527c6",
      "fixedValue": 20.0
    },
    {
      "walletId": "0b763922-aa88-4cbe-a567-e3fe8511fa06",
      "percentualValue": 10.0
    }
  ]
}
```

Ao atualizar cobrança, enviar `splits` vazio ou nulo pode remover o split. Proteja alterações de split com autorização forte no backend.

## Transferências

Criar transferência Pix:

```http
POST /transfers
```

```json
{
  "value": 1000.0,
  "pixAddressKey": "09493012301",
  "pixAddressKeyType": "CPF",
  "scheduleDate": null,
  "description": "Transferencia via Pix"
}
```

Criar transferência bancária:

```json
{
  "value": 1000.0,
  "bankAccount": {
    "bank": {
      "code": "237"
    },
    "ownerName": "Marcelo Almeida",
    "cpfCnpj": "52233424611",
    "agency": "1263",
    "account": "9999991",
    "accountDigit": "1",
    "bankAccountType": "CONTA_CORRENTE"
  }
}
```

Regras de transferência:

- Trate transferências como operação de alto risco.
- Exija autorização explícita e validações server-side.
- Considere webhook de autorização de transferência e restrição de IP.
- Mantenha destinatários em registros verificados no banco.

## Webhooks

Criar configuração de webhook:

```http
POST /webhooks
```

```json
{
  "name": "Webhook Pagamentos",
  "url": "https://your-domain.com/functions/v1/asaas-webhook",
  "email": "dev@your-domain.com",
  "enabled": true,
  "interrupted": false,
  "authToken": "same-value-as-ASAAS_WEBHOOK_AUTH_TOKEN",
  "sendType": "SEQUENTIALLY",
  "events": [
    "PAYMENT_CREATED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_RECEIVED",
    "PAYMENT_OVERDUE",
    "PAYMENT_REFUNDED",
    "PAYMENT_DELETED"
  ]
}
```

Regras do recebedor:

- Leia o header `asaas-access-token`.
- Compare com `ASAAS_WEBHOOK_AUTH_TOKEN`.
- Retorne `401` se o token for inválido.
- Salve `event.id` antes de processar.
- Se `event.id` já existir, retorne `200` e ignore o duplicado.
- Retorne `200` rapidamente após persistência durável.
- Processe atualização de status de forma assíncrona quando possível.
- Ignore campos desconhecidos no payload.

Payload comum:

```json
{
  "id": "evt_000000000000",
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "object": "payment",
    "id": "pay_000000000000"
  }
}
```

Eventos importantes:

```text
PAYMENT_CREATED
PAYMENT_UPDATED
PAYMENT_CONFIRMED
PAYMENT_RECEIVED
PAYMENT_OVERDUE
PAYMENT_REFUNDED
PAYMENT_PARTIALLY_REFUNDED
PAYMENT_DELETED
PAYMENT_RESTORED
PAYMENT_CHARGEBACK_REQUESTED
PAYMENT_CREDIT_CARD_CAPTURE_REFUSED
PAYMENT_BANK_SLIP_VIEWED
PAYMENT_CHECKOUT_VIEWED
```

## Padrão para Supabase Edge Function

Use este padrão para funções chamadas pela UI do Lovable:

```ts
const ASAAS_BASE_URL = Deno.env.get("ASAAS_BASE_URL")!;
const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")!;

async function asaasFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "lovable-asaas-integration",
      "access_token": ASAAS_API_KEY,
      ...(init.headers ?? {})
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.description ?? `Asaas request failed: ${response.status}`);
  }

  return data;
}
```

Valide entrada antes de chamar o Asaas:

```ts
const body = await req.json();
const order = await loadOrderOwnedByUser(body.orderId, user.id);
const value = order.total;
const dueDate = new Date().toISOString().slice(0, 10);
```

## Tratamento de erros

- Normalize erros do Asaas em mensagens seguras para usuário.
- Preserve detalhes crus apenas em logs protegidos do backend.
- Use retry somente para falhas de rede ou 5xx.
- Não faça retry automático para validação, autorização ou recusa de cartão.
- Após falha ambígua, consulte pagamento por ID ou `externalReference` antes de criar nova cobrança.
- Prefira idempotência por registros locais e `externalReference`.

## Checklist de aceite

- Nenhum segredo Asaas aparece no frontend.
- Sandbox e produção usam URLs e chaves diferentes.
- Cliente é reutilizado quando possível.
- Registros locais salvam IDs Asaas e `externalReference`.
- Valores de pagamento são calculados no backend.
- QR Code Pix e copia-e-cola são obtidos pelo backend.
- Webhook valida `asaas-access-token`.
- Webhook é idempotente por `event.id`.
- UI exibe estados claros: pendente, pago, vencido, reembolsado e falhou.
- Transferências e splits têm autorização mais forte que cobranças comuns.
