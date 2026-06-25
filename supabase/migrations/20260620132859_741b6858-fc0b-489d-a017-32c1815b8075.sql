
-- cielo_config
CREATE TABLE public.cielo_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  merchant_id_sandbox text,
  merchant_key_sandbox text,
  merchant_id_production text,
  merchant_key_production text,
  provider_credit text NOT NULL DEFAULT 'Cielo30',
  provider_debit text NOT NULL DEFAULT 'Cielo30',
  provider_boleto text NOT NULL DEFAULT 'Bradesco2',
  provider_pix text NOT NULL DEFAULT 'Cielo2',
  default_soft_descriptor text,
  default_capture boolean NOT NULL DEFAULT false,
  antifraud_enabled boolean NOT NULL DEFAULT false,
  antifraud_provider text,
  webhook_secret text,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cielo_config TO authenticated;
GRANT ALL ON public.cielo_config TO service_role;

ALTER TABLE public.cielo_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage cielo_config"
  ON public.cielo_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_cielo_config_updated_at
  BEFORE UPDATE ON public.cielo_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- cielo_logs
CREATE TABLE public.cielo_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('outbound','inbound','webhook')),
  endpoint text,
  method text,
  request_id text,
  merchant_order_id text,
  payment_id text,
  status_code integer,
  request_body jsonb,
  response_body jsonb,
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cielo_logs TO authenticated;
GRANT ALL ON public.cielo_logs TO service_role;

ALTER TABLE public.cielo_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read cielo_logs"
  ON public.cielo_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_cielo_logs_created_at ON public.cielo_logs (created_at DESC);
CREATE INDEX idx_cielo_logs_payment_id ON public.cielo_logs (payment_id);

-- cielo_webhooks
CREATE TABLE public.cielo_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text,
  change_type integer,
  recurrent_payment_id text,
  payload jsonb,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cielo_webhooks TO authenticated;
GRANT ALL ON public.cielo_webhooks TO service_role;

ALTER TABLE public.cielo_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read cielo_webhooks"
  ON public.cielo_webhooks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_cielo_webhooks_created_at ON public.cielo_webhooks (created_at DESC);
CREATE INDEX idx_cielo_webhooks_payment_id ON public.cielo_webhooks (payment_id);
