
CREATE TABLE public.instagram_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active boolean NOT NULL DEFAULT false,
  access_token text NOT NULL DEFAULT '',
  business_account_id text NOT NULL DEFAULT '',
  token_expires_at timestamptz,
  post_count int NOT NULL DEFAULT 6,
  layout text NOT NULL DEFAULT 'grid',
  columns_desktop int NOT NULL DEFAULT 3,
  columns_mobile int NOT NULL DEFAULT 2,
  aspect_ratio text NOT NULL DEFAULT 'square',
  show_caption boolean NOT NULL DEFAULT true,
  show_type_icon boolean NOT NULL DEFAULT true,
  title text NOT NULL DEFAULT 'Siga a Jotazo no Instagram',
  subtitle text NOT NULL DEFAULT 'Acompanhe novidades, bastidores e dicas no nosso perfil.',
  profile_url text NOT NULL DEFAULT 'https://instagram.com/jotazotelecom',
  cta_label text NOT NULL DEFAULT 'Ver perfil',
  cache_minutes int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage instagram_settings"
  ON public.instagram_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_instagram_settings_updated_at
BEFORE UPDATE ON public.instagram_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View pública sem campos sensíveis
CREATE VIEW public.instagram_settings_public
WITH (security_invoker = true)
AS
SELECT
  id, active, post_count, layout, columns_desktop, columns_mobile,
  aspect_ratio, show_caption, show_type_icon, title, subtitle,
  profile_url, cta_label, cache_minutes, updated_at
FROM public.instagram_settings;

GRANT SELECT ON public.instagram_settings_public TO anon, authenticated;

-- Permite leitura pública da tabela apenas com SELECT sobre colunas seguras via view
-- Para que a view seja legível, precisamos de uma policy SELECT que filtre acesso por coluna.
-- Como RLS não suporta column-level, fazemos: policy SELECT que permite a todos, e a view
-- restringe colunas. Mas isso vazaria o token via SELECT direto. Solução: deixar SELECT apenas
-- para admins; e dar acesso à view via SECURITY DEFINER function se necessário.
-- Como security_invoker=true, a view também respeita RLS. Vamos então adicionar uma policy
-- SELECT pública apenas para colunas seguras usando uma policy permissiva e travando colunas
-- por revogação no GRANT.

CREATE POLICY "Public can read instagram_settings"
  ON public.instagram_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Revoga acesso direto aos campos sensíveis para anon e authenticated
REVOKE ALL ON public.instagram_settings FROM anon, authenticated;
GRANT SELECT (
  id, active, post_count, layout, columns_desktop, columns_mobile,
  aspect_ratio, show_caption, show_type_icon, title, subtitle,
  profile_url, cta_label, cache_minutes, updated_at, created_at
) ON public.instagram_settings TO anon, authenticated;

-- Linha singleton
INSERT INTO public.instagram_settings (id) VALUES (gen_random_uuid());
