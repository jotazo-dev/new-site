ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '';