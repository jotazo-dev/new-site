GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_proposals TO authenticated;
GRANT ALL ON public.commercial_proposals TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.commercial_proposals_number_seq TO authenticated;
GRANT ALL ON SEQUENCE public.commercial_proposals_number_seq TO service_role;

DROP POLICY IF EXISTS "Admins can update site assets" ON storage.objects;
CREATE POLICY "Admins can update site assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Propostas section can upload site-assets propostas" ON storage.objects;
DROP POLICY IF EXISTS "Propostas section can update site-assets propostas" ON storage.objects;
DROP POLICY IF EXISTS "Propostas section can delete site-assets propostas" ON storage.objects;

CREATE POLICY "Propostas section can upload proposal PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_section_permission(auth.uid(), 'propostas')
  )
);

CREATE POLICY "Propostas section can update proposal PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_section_permission(auth.uid(), 'propostas')
  )
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_section_permission(auth.uid(), 'propostas')
  )
);

CREATE POLICY "Propostas section can delete proposal PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_section_permission(auth.uid(), 'propostas')
  )
);