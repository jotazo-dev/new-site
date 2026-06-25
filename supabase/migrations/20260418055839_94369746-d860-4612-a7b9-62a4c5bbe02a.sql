ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS combo_discount_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS combo_highlight_text text NOT NULL DEFAULT '';