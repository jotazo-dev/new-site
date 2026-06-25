
-- Add moderator to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- RPC to list users with roles (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz, role text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at,
           COALESCE(ur.role::text, 'user') as role
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

-- RPC to set user role (admin only)
CREATE OR REPLACE FUNCTION public.set_user_role(_target_user_id uuid, _new_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  IF _new_role != 'user' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _new_role);
  END IF;
END;
$$;
