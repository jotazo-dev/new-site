DROP POLICY IF EXISTS "Authenticated can upload proposal PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update proposal PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete proposal PDFs" ON storage.objects;

CREATE POLICY "Authenticated can upload proposal PDFs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND lower(storage.extension(name)) = 'pdf'
);

CREATE POLICY "Authenticated can update proposal PDFs"
ON storage.objects
FOR UPDATE
TO public
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND lower(storage.extension(name)) = 'pdf'
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND lower(storage.extension(name)) = 'pdf'
);

CREATE POLICY "Authenticated can delete proposal PDFs"
ON storage.objects
FOR DELETE
TO public
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'site-assets'
  AND name LIKE 'propostas/%'
  AND lower(storage.extension(name)) = 'pdf'
);