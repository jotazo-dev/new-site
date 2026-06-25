
-- Create role_permissions table
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  section text NOT NULL,
  allowed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, section)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage role_permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated can read
CREATE POLICY "Authenticated can read role_permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.role_permissions (role, section, allowed) VALUES
  ('admin', 'dashboard', true),
  ('admin', 'planos', true),
  ('admin', 'personalizacao', true),
  ('admin', 'blog', true),
  ('admin', 'anuncios', true),
  ('admin', 'paginas', true),
  ('admin', 'cobertura', true),
  ('admin', 'usuarios', true),
  ('admin', 'configuracoes', true),
  ('moderator', 'dashboard', false),
  ('moderator', 'planos', false),
  ('moderator', 'personalizacao', false),
  ('moderator', 'blog', false),
  ('moderator', 'anuncios', false),
  ('moderator', 'paginas', false),
  ('moderator', 'cobertura', false),
  ('moderator', 'usuarios', false),
  ('moderator', 'configuracoes', false),
  ('user', 'dashboard', false),
  ('user', 'planos', false),
  ('user', 'personalizacao', false),
  ('user', 'blog', false),
  ('user', 'anuncios', false),
  ('user', 'paginas', false),
  ('user', 'cobertura', false),
  ('user', 'usuarios', false),
  ('user', 'configuracoes', false);
