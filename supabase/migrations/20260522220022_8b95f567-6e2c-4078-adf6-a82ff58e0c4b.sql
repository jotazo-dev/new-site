
UPDATE storage.buckets SET public = false WHERE id = 'esim-assets';

DROP POLICY IF EXISTS "Public read esim-assets" ON storage.objects;

CREATE POLICY "Admins read esim-assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'));
