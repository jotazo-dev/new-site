CREATE POLICY "Propostas section can upload site-assets propostas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-assets' AND (storage.foldername(name))[1] = 'propostas' AND has_section_permission(auth.uid(), 'propostas'));

CREATE POLICY "Propostas section can update site-assets propostas"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-assets' AND (storage.foldername(name))[1] = 'propostas' AND has_section_permission(auth.uid(), 'propostas'))
WITH CHECK (bucket_id = 'site-assets' AND (storage.foldername(name))[1] = 'propostas' AND has_section_permission(auth.uid(), 'propostas'));

CREATE POLICY "Propostas section can delete site-assets propostas"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-assets' AND (storage.foldername(name))[1] = 'propostas' AND has_section_permission(auth.uid(), 'propostas'));