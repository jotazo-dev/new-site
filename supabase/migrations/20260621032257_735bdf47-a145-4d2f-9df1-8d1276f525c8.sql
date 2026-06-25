
-- 1) Routing table
CREATE TABLE IF NOT EXISTS public.payment_routing (
  method text PRIMARY KEY,
  primary_provider text NOT NULL,
  fallback_order text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_routing_method_chk CHECK (method IN ('credit','debit','pix','boleto')),
  CONSTRAINT payment_routing_primary_chk CHECK (primary_provider IN ('cielo','mercadopago','asaas'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_routing TO authenticated;
GRANT ALL ON public.payment_routing TO service_role;

ALTER TABLE public.payment_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payment_routing"
  ON public.payment_routing
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payment_routing_updated_at
  BEFORE UPDATE ON public.payment_routing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Seed: tudo Cielo, sem fallbacks (preserva comportamento)
INSERT INTO public.payment_routing (method, primary_provider, fallback_order, enabled) VALUES
  ('credit','cielo','{}', true),
  ('debit','cielo','{}', true),
  ('pix','cielo','{}', true),
  ('boleto','cielo','{}', true)
ON CONFLICT (method) DO NOTHING;

-- 3) Colunas novas em checkout_orders (compat: cielo_* ficam)
ALTER TABLE public.checkout_orders
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS provider_attempts jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS checkout_orders_provider_payment_id_idx
  ON public.checkout_orders (provider, provider_payment_id);
