-- Corrige upsert de PDFs de propostas no storage.
-- O upload com upsert precisa conseguir ler o objeto existente antes de atualizá-lo.
-- MVNO já tinha política de leitura no bucket esim-assets; site-assets/propostas não tinha.

DROP POLICY IF EXISTS "Admins can read site assets" ON storage.objects;
DROP POLICY IF EXISTS "Propostas section can read proposal PDFs" ON storage.objects;

CREATE POLICY "Admins can read site assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'site-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Propostas section can read proposal PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_section_permission(auth.uid(), 'propostas')
  )
);