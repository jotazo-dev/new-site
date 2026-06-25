-- ============ mp_config ============
CREATE TABLE public.mp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  access_token_sandbox text,
  public_key_sandbox text,
  access_token_production text,
  public_key_production text,
  webhook_secret text,
  site_id text NOT NULL DEFAULT 'MLB',
  currency_id text NOT NULL DEFAULT 'BRL',
  default_statement_descriptor text,
  default_capture boolean NOT NULL DEFAULT true,
  three_d_secure_mode text NOT NULL DEFAULT 'optional' CHECK (three_d_secure_mode IN ('optional','mandatory','not_supported')),
  max_installments int NOT NULL DEFAULT 12,
  binary_mode boolean NOT NULL DEFAULT false,
  pix_expiration_minutes int NOT NULL DEFAULT 30,
  boleto_due_days int NOT NULL DEFAULT 3,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_config TO authenticated;
GRANT ALL ON public.mp_config TO service_role;
ALTER TABLE public.mp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access mp_config" ON public.mp_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_mp_config_updated BEFORE UPDATE ON public.mp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ mp_logs ============
CREATE TABLE public.mp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL DEFAULT 'outbound',
  endpoint text NOT NULL,
  method text NOT NULL,
  request_id text,
  idempotency_key text,
  external_reference text,
  payment_id text,
  status_code int,
  request_body jsonb,
  response_body jsonb,
  duration_ms int,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_logs TO authenticated;
GRANT ALL ON public.mp_logs TO service_role;
ALTER TABLE public.mp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read mp_logs" ON public.mp_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_mp_logs_created ON public.mp_logs(created_at DESC);
CREATE INDEX idx_mp_logs_payment ON public.mp_logs(payment_id);

-- ============ mp_webhooks ============
CREATE TABLE public.mp_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text,
  action text,
  data_id text,
  live_mode boolean,
  signature_valid boolean DEFAULT false,
  raw_headers jsonb,
  raw_body jsonb,
  processed boolean NOT NULL DEFAULT false,
  process_error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_webhooks TO authenticated;
GRANT ALL ON public.mp_webhooks TO service_role;
ALTER TABLE public.mp_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read mp_webhooks" ON public.mp_webhooks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_mp_webhooks_received ON public.mp_webhooks(received_at DESC);
CREATE INDEX idx_mp_webhooks_data_id ON public.mp_webhooks(data_id);

-- Seed row vazia
INSERT INTO public.mp_config (environment, active) VALUES ('sandbox', false);