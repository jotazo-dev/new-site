
CREATE TABLE public.rbx_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_url text NOT NULL DEFAULT '',
  auth_key_v1 text NOT NULL DEFAULT '',
  auth_key_v2 text NOT NULL DEFAULT '',
  environment text NOT NULL DEFAULT 'homologacao',
  active boolean NOT NULL DEFAULT true,
  last_test_at timestamptz,
  last_test_status text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rbx_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rbx_config"
  ON public.rbx_config FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_rbx_config_updated_at
  BEFORE UPDATE ON public.rbx_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
