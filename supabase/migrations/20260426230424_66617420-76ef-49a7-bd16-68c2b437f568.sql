
-- Bio page settings (singleton row)
CREATE TABLE IF NOT EXISTS public.bio_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_url text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT 'Jotazo Telecom',
  description text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  facebook_url text NOT NULL DEFAULT '',
  youtube_url text NOT NULL DEFAULT '',
  tiktok_url text NOT NULL DEFAULT '',
  whatsapp_url text NOT NULL DEFAULT '',
  footer_text text NOT NULL DEFAULT 'Jotazo Telecom Copyright ® 2026 - Todos os Direitos Reservados.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read bio_settings" ON public.bio_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage bio_settings" ON public.bio_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bio_settings_updated_at BEFORE UPDATE ON public.bio_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cards (clickable images on bio page)
CREATE TABLE IF NOT EXISTS public.bio_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL DEFAULT '',
  link_url text NOT NULL DEFAULT '',
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bio_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read bio_cards" ON public.bio_cards FOR SELECT USING (true);
CREATE POLICY "Admins can manage bio_cards" ON public.bio_cards FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bio_cards_updated_at BEFORE UPDATE ON public.bio_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed singleton settings + 6 default cards
INSERT INTO public.bio_settings (description) VALUES ('Internet de fibra, 5G e TV. Conecte-se com a gente pelas nossas redes.');

INSERT INTO public.bio_cards (sort_order, alt) VALUES
  (1, 'Espaço 1'), (2, 'Espaço 2'), (3, 'Espaço 3'),
  (4, 'Espaço 4'), (5, 'Espaço 5'), (6, 'Espaço 6');
