
CREATE TABLE public.combo_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.combo_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage combo_options"
  ON public.combo_options FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read combo_options"
  ON public.combo_options FOR SELECT TO public
  USING (true);

CREATE TRIGGER update_combo_options_updated_at
  BEFORE UPDATE ON public.combo_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
