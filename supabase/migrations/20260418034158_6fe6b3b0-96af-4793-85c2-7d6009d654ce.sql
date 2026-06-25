CREATE TABLE public.banner_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_type text NOT NULL,
  banner_id uuid NOT NULL,
  link_url text NOT NULL DEFAULT '',
  page_path text NOT NULL DEFAULT '/',
  session_id text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_banner_clicks_type_date ON public.banner_clicks (banner_type, created_at DESC);
CREATE INDEX idx_banner_clicks_banner_id ON public.banner_clicks (banner_id);

ALTER TABLE public.banner_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert banner clicks"
  ON public.banner_clicks
  FOR INSERT
  TO public
  WITH CHECK (banner_type IN ('hero', 'promo', 'mid'));

CREATE POLICY "Admins can read banner clicks"
  ON public.banner_clicks
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banner clicks"
  ON public.banner_clicks
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));