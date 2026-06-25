
-- Tabela de cidades de cobertura
CREATE TABLE public.coverage_cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CE',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coverage_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read coverage_cities" ON public.coverage_cities
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage coverage_cities" ON public.coverage_cities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_coverage_cities_updated_at
  BEFORE UPDATE ON public.coverage_cities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de faixas de CEP
CREATE TABLE public.coverage_ceps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cep_start TEXT NOT NULL,
  cep_end TEXT NOT NULL,
  city_id UUID NOT NULL REFERENCES public.coverage_cities(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coverage_ceps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read coverage_ceps" ON public.coverage_ceps
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage coverage_ceps" ON public.coverage_ceps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_coverage_ceps_updated_at
  BEFORE UPDATE ON public.coverage_ceps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index para busca de CEP por faixa
CREATE INDEX idx_coverage_ceps_range ON public.coverage_ceps (cep_start, cep_end);
