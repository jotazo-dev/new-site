
-- 1) Table
CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  phone TEXT,
  birthdate DATE,
  rbx_code TEXT,
  rbx_linked_at TIMESTAMPTZ,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_profiles_cpf ON public.customer_profiles(cpf_cnpj);
CREATE INDEX idx_customer_profiles_rbx_code ON public.customer_profiles(rbx_code) WHERE rbx_code IS NOT NULL;

-- 2) GRANTs
GRANT SELECT, INSERT, UPDATE ON public.customer_profiles TO authenticated;
GRANT ALL ON public.customer_profiles TO service_role;

-- 3) RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer can view own profile"
ON public.customer_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "customer can insert own profile"
ON public.customer_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "customer can update own profile"
ON public.customer_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) updated_at trigger
CREATE TRIGGER trg_customer_profiles_updated_at
BEFORE UPDATE ON public.customer_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Auto-create profile on signup (reads metadata sent in signUp options.data)
CREATE OR REPLACE FUNCTION public.handle_new_customer_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_cpf TEXT;
  v_phone TEXT;
  v_opt BOOLEAN;
BEGIN
  v_full_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name','')), '');
  v_cpf := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj',''), '\D', '', 'g');
  v_phone := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone','')), '');
  v_opt := COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false);

  -- only create when both required fields present (signups via /conta/cadastro)
  IF v_full_name IS NOT NULL AND length(v_cpf) IN (11,14) THEN
    INSERT INTO public.customer_profiles (user_id, full_name, cpf_cnpj, phone, marketing_opt_in)
    VALUES (NEW.id, v_full_name, v_cpf, v_phone, v_opt)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_customer
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer_user();
