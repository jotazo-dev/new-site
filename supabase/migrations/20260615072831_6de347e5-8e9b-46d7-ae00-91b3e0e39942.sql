
ALTER TABLE public.mvno_activations
  ADD COLUMN IF NOT EXISTS rbx_cliente_codigo text,
  ADD COLUMN IF NOT EXISTS rbx_contrato_codigo text,
  ADD COLUMN IF NOT EXISTS rbx_os_codigo text,
  ADD COLUMN IF NOT EXISTS rbx_status text;

CREATE TABLE IF NOT EXISTS public.mvno_rbx_plan_map (
  provider text NOT NULL,
  product_sku text NOT NULL,
  rbx_plan_codigo text NOT NULL,
  rbx_plan_label text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, product_sku)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mvno_rbx_plan_map TO authenticated;
GRANT ALL ON public.mvno_rbx_plan_map TO service_role;

ALTER TABLE public.mvno_rbx_plan_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mvno_rbx_plan_map"
  ON public.mvno_rbx_plan_map
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read mvno_rbx_plan_map"
  ON public.mvno_rbx_plan_map
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_mvno_rbx_plan_map_updated_at
  BEFORE UPDATE ON public.mvno_rbx_plan_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
