
-- 1) Expandir mvno_rbx_plan_map
ALTER TABLE public.mvno_rbx_plan_map
  ADD COLUMN IF NOT EXISTS eai_plan_id text,
  ADD COLUMN IF NOT EXISTS eai_plan_name text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_mvno_map_product_sku ON public.mvno_rbx_plan_map(product_sku);
CREATE INDEX IF NOT EXISTS idx_mvno_map_eai_plan_id ON public.mvno_rbx_plan_map(eai_plan_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mvno_map_provider_plan_sim
  ON public.mvno_rbx_plan_map(provider, plan_id, sim_kind)
  WHERE plan_id IS NOT NULL;

-- 2) Cache Algar
CREATE TABLE IF NOT EXISTS public.algar_products_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.algar_products_cache TO authenticated;
GRANT ALL ON public.algar_products_cache TO service_role;
ALTER TABLE public.algar_products_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage algar cache"
  ON public.algar_products_cache FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_algar_cache_updated_at BEFORE UPDATE ON public.algar_products_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Cache EAI
CREATE TABLE IF NOT EXISTS public.eai_plans_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eai_plan_id text NOT NULL UNIQUE,
  name text NOT NULL,
  price_cents integer,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eai_plans_cache TO authenticated;
GRANT ALL ON public.eai_plans_cache TO service_role;
ALTER TABLE public.eai_plans_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage eai cache"
  ON public.eai_plans_cache FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_eai_cache_updated_at BEFORE UPDATE ON public.eai_plans_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Cache RBX
CREATE TABLE IF NOT EXISTS public.rbx_plans_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descricao text NOT NULL,
  valor_cents integer,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbx_plans_cache TO authenticated;
GRANT ALL ON public.rbx_plans_cache TO service_role;
ALTER TABLE public.rbx_plans_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage rbx cache"
  ON public.rbx_plans_cache FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rbx_cache_updated_at BEFORE UPDATE ON public.rbx_plans_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Marca dados existentes como recém-sincronizados
UPDATE public.mvno_rbx_plan_map SET last_synced_at = now() WHERE last_synced_at IS NULL;
