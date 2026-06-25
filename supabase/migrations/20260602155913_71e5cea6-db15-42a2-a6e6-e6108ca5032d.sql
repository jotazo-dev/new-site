
-- Restrict custom_roles to admins only
DROP POLICY IF EXISTS "Authenticated can read custom_roles" ON public.custom_roles;
CREATE POLICY "Admins can read custom_roles"
ON public.custom_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Restrict role_permissions: admin sees all, others only their own role
DROP POLICY IF EXISTS "Authenticated can read role_permissions" ON public.role_permissions;
CREATE POLICY "Read role_permissions admin or own role"
ON public.role_permissions FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND COALESCE(ur.role_slug, ur.role::text) = role_permissions.role_slug
  )
);

-- Drop overly permissive proposal PDF storage policies
DROP POLICY IF EXISTS "Authenticated can upload proposal PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update proposal PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete proposal PDFs" ON storage.objects;
