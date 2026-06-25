CREATE TABLE public.sitemap_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL UNIQUE,
  priority text NOT NULL DEFAULT '0.5',
  changefreq text NOT NULL DEFAULT 'monthly',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sitemap_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read sitemap_pages"
  ON public.sitemap_pages FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sitemap_pages"
  ON public.sitemap_pages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sitemap_pages_updated_at
  BEFORE UPDATE ON public.sitemap_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with default static pages
INSERT INTO public.sitemap_pages (path, priority, changefreq, sort_order) VALUES
  ('/', '1.0', 'weekly', 0),
  ('/planos', '0.9', 'weekly', 1),
  ('/para-voce', '0.8', 'monthly', 2),
  ('/para-empresas', '0.8', 'monthly', 3),
  ('/cobertura', '0.8', 'monthly', 4),
  ('/atendimento', '0.7', 'monthly', 5),
  ('/teste-de-velocidade', '0.6', 'monthly', 6),
  ('/sobre', '0.5', 'monthly', 7),
  ('/blog', '0.7', 'weekly', 8);