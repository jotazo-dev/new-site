
-- Add id column
ALTER TABLE public.mvno_rbx_plan_map ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();

-- Drop old composite PK and set id as PK
ALTER TABLE public.mvno_rbx_plan_map DROP CONSTRAINT IF EXISTS mvno_rbx_plan_map_pkey;
ALTER TABLE public.mvno_rbx_plan_map ADD PRIMARY KEY (id);

-- product_sku no longer required (EAÍ uses eai_plan_id)
ALTER TABLE public.mvno_rbx_plan_map ALTER COLUMN product_sku DROP NOT NULL;

-- Prevent duplicate bindings per (rbx code + sim type + provider)
CREATE UNIQUE INDEX IF NOT EXISTS mvno_rbx_plan_map_rbx_sim_provider_uidx
  ON public.mvno_rbx_plan_map (rbx_plan_codigo, COALESCE(sim_kind, 'esim'), provider);
