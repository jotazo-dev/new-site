
CREATE TABLE public.esim_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  qr_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.esim_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage esim_clients"
ON public.esim_clients FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER esim_clients_updated_at
BEFORE UPDATE ON public.esim_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('esim-assets', 'esim-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read esim-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'esim-assets');

CREATE POLICY "Admins upload esim-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update esim-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete esim-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'));
