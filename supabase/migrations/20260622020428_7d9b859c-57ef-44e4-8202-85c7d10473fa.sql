CREATE TABLE public.rbx_offline_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at timestamptz NOT NULL DEFAULT now(),
  total integer NOT NULL DEFAULT 0,
  by_region jsonb NOT NULL DEFAULT '[]'::jsonb,
  by_olt jsonb NOT NULL DEFAULT '[]'::jsonb,
  by_nas jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_rbx_offline_snapshots_captured_at ON public.rbx_offline_snapshots (captured_at DESC);

GRANT SELECT ON public.rbx_offline_snapshots TO authenticated;
GRANT ALL ON public.rbx_offline_snapshots TO service_role;

ALTER TABLE public.rbx_offline_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read offline snapshots"
  ON public.rbx_offline_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));