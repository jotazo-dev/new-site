-- 1) webmail-attachments: explicit admin-only SELECT (defense in depth)
DROP POLICY IF EXISTS "Admins read webmail-attachments" ON storage.objects;
CREATE POLICY "Admins read webmail-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'webmail-attachments' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) esim-assets: realign write policies from public to authenticated role
DROP POLICY IF EXISTS "Admins insert esim-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins update esim-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete esim-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins read esim-assets" ON storage.objects;

CREATE POLICY "Admins read esim-assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert esim-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update esim-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete esim-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'esim-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));