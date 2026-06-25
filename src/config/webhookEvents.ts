// Registry central de eventos de webhook. Usado pela UI da aba Automação.
export type WebhookEventGroup = "Pedidos" | "Ativações" | "Leads";

export interface WebhookEventDef {
  id: string;
  group: WebhookEventGroup;
  label: string;
  description: string;
  sample: Record<string, unknown>;
}

const ORDER_SAMPLE = {
  order: {
    id: "00000000-0000-0000-0000-000000000000",
    merchant_order_id: "JT-2026-000123",
    status: "paid",
    payment_method: "credit",
    installments: 3,
    total_cents: 12990,
    subtotal_cents: 14990,
    discount_cents: 2000,
    card_brand: "Visa",
    card_last4: "1234",
    cielo_payment_id: "abc-123",
    pix: { qr_string: null, expires_at: null },
    boleto: { url: null, digitable_line: null, due_date: null },
    paid_at: "2026-06-21T10:15:00Z",
  },
  customer: {
    name: "Maria Silva",
    email: "maria@example.com",
    phone: "5585999999999",
    doc: "12345678900",
  },
  items: [{ plan_id: "plan-1", name: "Plano 50GB", category: "movel", qty: 1, price_cents: 12990 }],
};

const PROV_SAMPLE = {
  order_id: "00000000-0000-0000-0000-000000000000",
  provider: "algar",
  sim_kind: "esim",
  msisdn: "5585999990000",
  iccid: "8955010012345678901",
  esim: { qr_url: "https://...", activation_code: "LPA:1$..." },
  provisioned_at: "2026-06-21T10:20:00Z",
};

const ACTIVATION_SAMPLE = {
  activation: {
    id: "00000000-0000-0000-0000-000000000000",
    provider: "algar",
    sim_kind: "esim",
    plan_code: "PLAN_50",
    status: "succeeded",
    msisdn: "5585999990000",
    iccid: "8955010012345678901",
    created_at: "2026-06-21T10:00:00Z",
  },
};

const LEAD_SAMPLE = {
  lead: {
    id: "00000000-0000-0000-0000-000000000000",
    stage: "qualificado",
    customer_name: "João Souza",
    customer_email: "joao@example.com",
    customer_phone: "5585988887777",
    city: "Fortaleza",
    total_cents: 9990,
  },
};

export const WEBHOOK_EVENTS: WebhookEventDef[] = [
  // Pedidos
  { id: "order.created", group: "Pedidos", label: "Pedido criado", description: "Disparado quando o pedido é criado no checkout.", sample: ORDER_SAMPLE },
  { id: "order.payment.pending", group: "Pedidos", label: "Pagamento pendente", description: "Pix gerado, boleto emitido ou aguardando confirmação.", sample: ORDER_SAMPLE },
  { id: "order.payment.authorized", group: "Pedidos", label: "Pagamento autorizado", description: "Cartão de crédito autorizado, aguardando captura.", sample: ORDER_SAMPLE },
  { id: "order.payment.paid", group: "Pedidos", label: "Pagamento confirmado", description: "Pagamento confirmado (pix, boleto compensado ou cartão capturado).", sample: { ...ORDER_SAMPLE, order: { ...ORDER_SAMPLE.order, status: "paid" } } },
  { id: "order.payment.failed", group: "Pedidos", label: "Pagamento recusado", description: "Pagamento negado ou erro definitivo.", sample: ORDER_SAMPLE },
  { id: "order.payment.canceled", group: "Pedidos", label: "Pedido cancelado", description: "Pedido cancelado antes do pagamento.", sample: ORDER_SAMPLE },
  { id: "order.payment.refunded", group: "Pedidos", label: "Pagamento estornado", description: "Valor estornado para o cliente.", sample: ORDER_SAMPLE },
  { id: "order.payment.expired", group: "Pedidos", label: "Pagamento expirado", description: "Pix ou boleto expirou sem pagamento.", sample: ORDER_SAMPLE },
  { id: "order.provisioning.queued", group: "Pedidos", label: "Provisionamento na fila", description: "Pedido entrou na fila de ativação.", sample: { order_id: "..." } },
  { id: "order.provisioning.started", group: "Pedidos", label: "Provisionamento iniciado", description: "Worker pegou o job de ativação.", sample: { order_id: "..." } },
  { id: "order.provisioning.succeeded", group: "Pedidos", label: "Provisionamento concluído", description: "Linha ativada com sucesso (msisdn/iccid/eSIM disponíveis).", sample: PROV_SAMPLE },
  { id: "order.provisioning.failed", group: "Pedidos", label: "Provisionamento falhou", description: "Falha definitiva no provisionamento.", sample: { order_id: "...", last_error: "Timeout na API" } },
  { id: "order.shipping.tracking_assigned", group: "Pedidos", label: "Código de rastreio gerado", description: "Chip físico postado, código de rastreio disponível.", sample: { order_id: "...", tracking_code: "AA123456789BR", carrier: "Correios" } },

  // Ativações
  { id: "activation.created", group: "Ativações", label: "Ativação criada", description: "Admin criou nova linha pelo painel.", sample: ACTIVATION_SAMPLE },
  { id: "activation.succeeded", group: "Ativações", label: "Ativação concluída", description: "Linha ativada com sucesso.", sample: ACTIVATION_SAMPLE },
  { id: "activation.failed", group: "Ativações", label: "Ativação falhou", description: "Falha na ativação da linha.", sample: ACTIVATION_SAMPLE },
  { id: "activation.esim_ready", group: "Ativações", label: "eSIM pronto", description: "QR Code / código LPA do eSIM disponível.", sample: ACTIVATION_SAMPLE },
  { id: "activation.email_sent", group: "Ativações", label: "E-mail de ativação enviado", description: "E-mail com instruções enviado ao cliente.", sample: { activation_id: "...", email: "cliente@example.com", template: "mvno_activation_default" } },

  // Leads
  { id: "lead.created", group: "Leads", label: "Lead criado", description: "Novo lead capturado (formulário, combo, contato).", sample: LEAD_SAMPLE },
  { id: "lead.stage_changed", group: "Leads", label: "Estágio do lead alterado", description: "Lead avançou ou retrocedeu de estágio no CRM.", sample: { ...LEAD_SAMPLE, from_stage: "novo", to_stage: "qualificado" } },
];

export const WEBHOOK_EVENT_GROUPS: WebhookEventGroup[] = ["Pedidos", "Ativações", "Leads"];

export function getEventDef(id: string): WebhookEventDef | undefined {
  return WEBHOOK_EVENTS.find((e) => e.id === id);
}

export function buildEnvelopeSample(eventId: string): Record<string, unknown> {
  const def = getEventDef(eventId);
  return {
    id: "evt_sample_abc123",
    event: eventId,
    created_at: new Date().toISOString(),
    api_version: "2026-06-21",
    delivery_attempt: 1,
    data: def?.sample ?? {},
  };
}
