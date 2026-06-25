CREATE TABLE public.page_top_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL DEFAULT '*',
  image_url text NOT NULL DEFAULT '',
  image_mobile_url text NOT NULL DEFAULT '',
  alt text NOT NULL DEFAULT '',
  link_url text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_top_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read page_top_banners"
  ON public.page_top_banners FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage page_top_banners"
  ON public.page_top_banners FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_page_top_banners_updated_at
  BEFORE UPDATE ON public.page_top_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_page_top_banners_path_active ON public.page_top_banners(path, active, sort_order);