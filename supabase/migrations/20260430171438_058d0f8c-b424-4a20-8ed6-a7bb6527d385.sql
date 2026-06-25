
-- ============================================================
-- 1. integrations: remover SELECT público, restringir a admins
-- ============================================================
DROP POLICY IF EXISTS "Public can read integrations" ON public.integrations;
-- Mantém: "Admins can manage integrations" (ALL)
-- Adiciona política de leitura para authenticated apenas se admin (já coberta por ALL, mas explicitamos para clareza)

-- ============================================================
-- 2. Realtime: restringir subscriptions a admins
-- ============================================================
-- Habilitar RLS em realtime.messages e criar policy admin-only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only realtime" ON realtime.messages;
CREATE POLICY "Admins only realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================
-- 3. Bucket testimonials: restringir INSERT/UPDATE/DELETE a admins
-- ============================================================
-- Remover políticas permissivas existentes (qualquer nome)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%testimonials%' OR with_check ILIKE '%testimonials%')
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins manage testimonials bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Garantir leitura pública (necessária para o site exibir as fotos)
DROP POLICY IF EXISTS "Public read testimonials bucket" ON storage.objects;
CREATE POLICY "Public read testimonials bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'testimonials');

-- ============================================================
-- 4. Bucket resumes: restringir upload por tipo e tamanho
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%resumes%' OR with_check ILIKE '%resumes%')
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public can upload resumes (validated)"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.extension(name) = ANY (ARRAY['pdf', 'doc', 'docx']))
  AND (metadata->>'size')::bigint <= 10485760  -- 10 MB
  AND length(name) <= 255
);

-- Admins podem ler/atualizar/deletar currículos
DROP POLICY IF EXISTS "Admins manage resumes bucket" ON storage.objects;
CREATE POLICY "Admins manage resumes bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'::public.app_role));
