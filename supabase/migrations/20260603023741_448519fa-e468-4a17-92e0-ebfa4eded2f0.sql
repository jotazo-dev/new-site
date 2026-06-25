ALTER TABLE public.esim_records
  ADD COLUMN IF NOT EXISTS numero_atual text,
  ADD COLUMN IF NOT EXISTS numero_temporario text;