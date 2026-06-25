ALTER TABLE public.page_top_banners
  ADD COLUMN IF NOT EXISTS height_px integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS overlay_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS overlay_color text NOT NULL DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS overlay_opacity integer NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS overlay_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS overlay_text_color text NOT NULL DEFAULT '#FFFFFF';