
CREATE TABLE public.mid_banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL DEFAULT '',
  image_mobile_url text NOT NULL DEFAULT '',
  alt text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mid_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read mid_banners" ON public.mid_banners FOR SELECT USING (true);
CREATE POLICY "Admins can manage mid_banners" ON public.mid_banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mid_banners_updated_at BEFORE UPDATE ON public.mid_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
