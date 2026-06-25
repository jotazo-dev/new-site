INSERT INTO public.role_permissions (role, section, allowed)
SELECT r.role, 'analytics', false
FROM (VALUES ('user'::app_role), ('moderator'::app_role)) AS r(role)
ON CONFLICT DO NOTHING;