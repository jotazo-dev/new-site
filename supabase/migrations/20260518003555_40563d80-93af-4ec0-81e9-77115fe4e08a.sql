
CREATE TABLE public.esim_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.esim_clients(id) ON DELETE CASCADE,
  qr_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX esim_records_client_id_idx ON public.esim_records(client_id);

ALTER TABLE public.esim_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage esim_records"
ON public.esim_records FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER esim_records_updated_at
BEFORE UPDATE ON public.esim_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migra dados existentes
INSERT INTO public.esim_records (client_id, qr_url, pdf_url, created_at, updated_at)
SELECT id, qr_url, pdf_url, created_at, updated_at
FROM public.esim_clients
WHERE qr_url IS NOT NULL OR pdf_url IS NOT NULL;

ALTER TABLE public.esim_clients DROP COLUMN qr_url;
ALTER TABLE public.esim_clients DROP COLUMN pdf_url;

-- Índice case-insensitive para busca por email
CREATE INDEX esim_clients_email_lower_idx ON public.esim_clients (lower(email));
