ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS portability_gb integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portability_label text NOT NULL DEFAULT '';