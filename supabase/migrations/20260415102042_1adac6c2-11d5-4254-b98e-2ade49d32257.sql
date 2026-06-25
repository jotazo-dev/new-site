ALTER TABLE public.plans ADD COLUMN type text NOT NULL DEFAULT 'plano';

UPDATE public.plans SET type = 'combo' WHERE category = 'combo';
