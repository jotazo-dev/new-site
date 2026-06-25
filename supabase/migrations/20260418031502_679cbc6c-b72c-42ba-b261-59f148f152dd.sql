ALTER TABLE public.page_top_banners
  ADD COLUMN IF NOT EXISTS overlay_align_h text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS overlay_align_v text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS overlay_subtitle text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS overlay_cta_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS overlay_cta_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS overlay_cta_bg text NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS overlay_cta_color text NOT NULL DEFAULT '#000000';