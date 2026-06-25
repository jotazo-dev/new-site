
-- Tabela de configuração Asaas (singleton)
CREATE TABLE public.asaas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  sandbox_api_key text,
  production_api_key text,
  sandbox_webhook_token text,
  production_webhook_token text,
  default_billing_type text NOT NULL DEFAULT 'UNDEFINED' CHECK (default_billing_type IN ('BOLETO','PIX','CREDIT_CARD','UNDEFINED')),
  default_due_days integer NOT NULL DEFAULT 3,
  notification_disabled boolean NOT NULL DEFAULT false,
  auto_create_customer boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asaas_config TO authenticated;
GRANT ALL ON public.asaas_config TO service_role;

ALTER TABLE public.asaas_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage asaas_config" ON public.asaas_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER asaas_config_updated_at BEFORE UPDATE ON public.asaas_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Logs de chamadas à API Asaas
CREATE TABLE public.asaas_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  duration_ms integer,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asaas_logs TO authenticated;
GRANT ALL ON public.asaas_logs TO service_role;

ALTER TABLE public.asaas_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read asaas_logs" ON public.asaas_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX asaas_logs_created_at_idx ON public.asaas_logs (created_at DESC);

-- Webhooks recebidos (idempotência)
CREATE TABLE public.asaas_webhooks (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  object_id text,
  environment text,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asaas_webhooks TO authenticated;
GRANT ALL ON public.asaas_webhooks TO service_role;

ALTER TABLE public.asaas_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read asaas_webhooks" ON public.asaas_webhooks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX asaas_webhooks_received_at_idx ON public.asaas_webhooks (received_at DESC);

-- Linha inicial singleton
INSERT INTO public.asaas_config (environment) VALUES ('sandbox');
