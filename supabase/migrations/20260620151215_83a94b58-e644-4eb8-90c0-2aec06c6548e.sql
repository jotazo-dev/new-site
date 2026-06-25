
-- algar_config (admin-only)
CREATE TABLE IF NOT EXISTS public.algar_config (
  id integer PRIMARY KEY DEFAULT 1,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  base_url_sandbox text NOT NULL DEFAULT 'https://sandbox-api.algartelecom.com.br',
  base_url_production text NOT NULL DEFAULT 'https://api.algartelecom.com.br',
  oauth_path text NOT NULL DEFAULT '/auth/token',
  default_msisdn_prefix text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row_algar CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE ON public.algar_config TO authenticated;
GRANT ALL ON public.algar_config TO service_role;
ALTER TABLE public.algar_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages algar config" ON public.algar_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_algar_config_updated_at
  BEFORE UPDATE ON public.algar_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.algar_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- algar_plan_map
CREATE TABLE IF NOT EXISTS public.algar_plan_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  sim_kind public.sim_kind NOT NULL,
  algar_product_id text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, sim_kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.algar_plan_map TO authenticated;
GRANT ALL ON public.algar_plan_map TO service_role;
ALTER TABLE public.algar_plan_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages algar plan map" ON public.algar_plan_map
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_algar_plan_map_updated_at
  BEFORE UPDATE ON public.algar_plan_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- algar_token_cache (service_role only)
CREATE TABLE IF NOT EXISTS public.algar_token_cache (
  environment text PRIMARY KEY,
  access_token text NOT NULL,
  token_type text NOT NULL DEFAULT 'Bearer',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.algar_token_cache TO service_role;
ALTER TABLE public.algar_token_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.algar_token_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_algar_token_cache_updated_at
  BEFORE UPDATE ON public.algar_token_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
