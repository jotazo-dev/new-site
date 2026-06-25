
DROP FUNCTION IF EXISTS public.get_admin_users();

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamptz,
  role text,
  role_slug text,
  first_name text,
  last_name text,
  avatar_url text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at,
           COALESCE(ur.role::text, 'user') as role,
           COALESCE(ur.role_slug, ur.role::text, 'user') as role_slug,
           p.first_name,
           p.last_name,
           p.avatar_url
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    LEFT JOIN public.profiles p ON p.user_id = u.id
    ORDER BY u.created_at DESC;
END;
$$;
