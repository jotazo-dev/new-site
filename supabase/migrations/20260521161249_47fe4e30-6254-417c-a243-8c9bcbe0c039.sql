
ALTER TABLE public.eai_config
  ADD COLUMN IF NOT EXISTS client_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_secret text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_token text NOT NULL DEFAULT '';

-- Restrict SELECT to admins only (credentials are secret)
DROP POLICY IF EXISTS "eai_config admin read" ON public.eai_config;
CREATE POLICY "eai_config admin read" ON public.eai_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
