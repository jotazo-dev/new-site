-- Tabela para armazenar os prefixos CIDR do GEOFEED (RFC 8805)
CREATE TABLE public.geofeed_prefixes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'BR',
  region TEXT NOT NULL DEFAULT 'BR-CE',
  city TEXT NOT NULL DEFAULT '',
  postal TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.geofeed_prefixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read geofeed_prefixes"
ON public.geofeed_prefixes
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage geofeed_prefixes"
ON public.geofeed_prefixes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_geofeed_prefixes_updated_at
BEFORE UPDATE ON public.geofeed_prefixes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_geofeed_prefixes_active_sort ON public.geofeed_prefixes(active, sort_order);