
-- EAI MVNO integration tables

CREATE TABLE IF NOT EXISTS public.eai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_url text NOT NULL DEFAULT '',
  oauth_url text NOT NULL DEFAULT '',
  client_id_hint text NOT NULL DEFAULT '',
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  active boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eai_token_cache (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token text NOT NULL,
  token_type text NOT NULL DEFAULT 'Bearer',
  expires_at timestamptz NOT NULL,
  scope text,
  obtained_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  method text NOT NULL,
  path text NOT NULL,
  status int,
  duration_ms int,
  request_body text,
  response_body text,
  error text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eai_logs_created_at_idx ON public.eai_logs (created_at DESC);

ALTER TABLE public.eai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eai_token_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eai_config admin read" ON public.eai_config FOR SELECT TO authenticated
  USING (public.has_section_permission(auth.uid(),'configuracoes'));
CREATE POLICY "eai_config admin write" ON public.eai_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "eai_token_cache admin read" ON public.eai_token_cache FOR SELECT TO authenticated
  USING (public.has_section_permission(auth.uid(),'configuracoes'));

CREATE POLICY "eai_logs admin read" ON public.eai_logs FOR SELECT TO authenticated
  USING (public.has_section_permission(auth.uid(),'configuracoes'));

CREATE TRIGGER eai_config_updated_at BEFORE UPDATE ON public.eai_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.eai_config (base_url, oauth_url, environment, active)
SELECT '', '', 'sandbox', false
WHERE NOT EXISTS (SELECT 1 FROM public.eai_config);
