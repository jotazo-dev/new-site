
ALTER TABLE public.mvno_rbx_plan_map
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sim_kind text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mvno_rbx_plan_map_plan_simkind
  ON public.mvno_rbx_plan_map (provider, plan_id, sim_kind)
  WHERE plan_id IS NOT NULL;
