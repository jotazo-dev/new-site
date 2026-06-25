
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read pages" ON public.pages FOR SELECT USING (true);

CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial pages
INSERT INTO public.pages (slug, title) VALUES
  ('/', 'Home'),
  ('/para-voce', 'Para Você'),
  ('/para-empresas', 'Para Empresas'),
  ('/planos', 'Planos'),
  ('/cobertura', 'Cobertura'),
  ('/atendimento', 'Atendimento'),
  ('/teste-de-velocidade', 'Teste de Velocidade'),
  ('/sobre', 'Sobre');
