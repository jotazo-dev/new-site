ALTER TABLE public.announcements
  ADD COLUMN popup_style text NOT NULL DEFAULT 'centered',
  ADD COLUMN display_pages jsonb NOT NULL DEFAULT '["all"]'::jsonb,
  ADD COLUMN frequency text NOT NULL DEFAULT 'once_per_session',
  ADD COLUMN delay_seconds integer NOT NULL DEFAULT 3;