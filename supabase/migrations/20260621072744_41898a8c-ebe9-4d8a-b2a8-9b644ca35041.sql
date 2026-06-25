
-- Site plan → RBX plan
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS rbx_plan_codigo text;

CREATE INDEX IF NOT EXISTS idx_plans_rbx_plan_codigo ON public.plans(rbx_plan_codigo);

-- mvno_rbx_plan_map: plan_id opcional + chave única por (rbx_plan_codigo, sim_kind, provider)
ALTER TABLE public.mvno_rbx_plan_map
  ALTER COLUMN plan_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mvno_map_rbx_sim_provider
  ON public.mvno_rbx_plan_map(rbx_plan_codigo, sim_kind, provider)
  WHERE rbx_plan_codigo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mvno_map_rbx_codigo
  ON public.mvno_rbx_plan_map(rbx_plan_codigo);
