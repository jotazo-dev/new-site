ALTER TABLE public.combo_options 
ADD COLUMN IF NOT EXISTS badge_label text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS badge_color text NOT NULL DEFAULT 'accent';