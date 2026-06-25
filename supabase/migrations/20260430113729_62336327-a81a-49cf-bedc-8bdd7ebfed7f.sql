-- 1. custom_roles table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'blue',
  is_system boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read custom_roles" ON public.custom_roles;
CREATE POLICY "Authenticated can read custom_roles"
  ON public.custom_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage custom_roles" ON public.custom_roles;
CREATE POLICY "Admins can manage custom_roles"
  ON public.custom_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_custom_roles_updated_at ON public.custom_roles;
CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.custom_roles (slug, label, description, color, is_system, sort_order) VALUES
  ('admin', 'Admin', 'Acesso total ao sistema', 'red', true, 0),
  ('moderator', 'Moderador', 'Acesso de moderação', 'yellow', true, 1),
  ('user', 'Usuário', 'Acesso básico', 'blue', true, 2)
ON CONFLICT (slug) DO NOTHING;

-- 2. role_slug columns
ALTER TABLE public.role_permissions ADD COLUMN IF NOT EXISTS role_slug text;
UPDATE public.role_permissions SET role_slug = role::text WHERE role_slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_slug_section_idx
  ON public.role_permissions (role_slug, section)
  WHERE role_slug IS NOT NULL;

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_slug text;
UPDATE public.user_roles SET role_slug = role::text WHERE role_slug IS NULL;

-- 3. has_section_permission
CREATE OR REPLACE FUNCTION public.has_section_permission(_user_id uuid, _section text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN has_role(_user_id, 'admin'::app_role) THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp
        ON rp.role_slug = COALESCE(ur.role_slug, ur.role::text)
      WHERE ur.user_id = _user_id AND rp.section = _section AND rp.allowed = true
    )
  END
$$;

-- 4. set_user_role_slug
CREATE OR REPLACE FUNCTION public.set_user_role_slug(_target_user_id uuid, _new_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE slug = _new_slug) THEN
    RAISE EXCEPTION 'Role does not exist: %', _new_slug;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  IF _new_slug = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role, role_slug)
    VALUES (_target_user_id, 'admin'::app_role, 'admin');
  ELSIF _new_slug = 'moderator' THEN
    INSERT INTO public.user_roles (user_id, role, role_slug)
    VALUES (_target_user_id, 'moderator'::app_role, 'moderator');
  ELSE
    INSERT INTO public.user_roles (user_id, role, role_slug)
    VALUES (_target_user_id, 'user'::app_role, _new_slug);
  END IF;
END;
$$;

-- 5. get_admin_users (drop first to change return type)
DROP FUNCTION IF EXISTS public.get_admin_users();
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz, role text, role_slug text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at,
           COALESCE(ur.role::text, 'user') as role,
           COALESCE(ur.role_slug, ur.role::text, 'user') as role_slug
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

-- 6. count helper
CREATE OR REPLACE FUNCTION public.count_users_by_role_slug(_slug text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int FROM public.user_roles
  WHERE COALESCE(role_slug, role::text) = _slug
$$;

-- 7. Seed missing sections
INSERT INTO public.role_permissions (role, role_slug, section, allowed)
SELECT 'admin'::app_role, 'admin', s, true
FROM unnest(ARRAY['painel','crm','analytics','geofeed','vagas','curriculos']) s
WHERE NOT EXISTS (SELECT 1 FROM public.role_permissions WHERE role_slug = 'admin' AND section = s);

INSERT INTO public.role_permissions (role, role_slug, section, allowed)
SELECT 'moderator'::app_role, 'moderator', s, false
FROM unnest(ARRAY['painel','crm','geofeed','vagas','curriculos']) s
WHERE NOT EXISTS (SELECT 1 FROM public.role_permissions WHERE role_slug = 'moderator' AND section = s);

INSERT INTO public.role_permissions (role, role_slug, section, allowed)
SELECT 'user'::app_role, 'user', s, false
FROM unnest(ARRAY['painel','crm','geofeed','vagas','curriculos']) s
WHERE NOT EXISTS (SELECT 1 FROM public.role_permissions WHERE role_slug = 'user' AND section = s);