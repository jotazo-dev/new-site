ALTER TABLE public.announcements
  ADD COLUMN type text NOT NULL DEFAULT 'bar',
  ADD COLUMN title text NOT NULL DEFAULT '',
  ADD COLUMN image_url text NOT NULL DEFAULT '',
  ADD COLUMN cta_text text NOT NULL DEFAULT '',
  ADD COLUMN cta_url text NOT NULL DEFAULT '';