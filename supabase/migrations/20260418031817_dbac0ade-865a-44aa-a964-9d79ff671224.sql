ALTER TABLE public.page_top_banners
  ADD COLUMN IF NOT EXISTS overlay_type text NOT NULL DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS overlay_color2 text NOT NULL DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS overlay_gradient_dir text NOT NULL DEFAULT 'to bottom',
  ADD COLUMN IF NOT EXISTS overlay_cta_variant text NOT NULL DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS overlay_cta_size text NOT NULL DEFAULT 'md';