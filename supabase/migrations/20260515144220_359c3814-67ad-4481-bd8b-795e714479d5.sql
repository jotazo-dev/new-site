-- Tabela de cupons promocionais gerenciados pelo admin
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' (centavos) | 'percent' (0-100)
  discount_value INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  show_in_checkout BOOLEAN NOT NULL DEFAULT true,
  show_in_exit_popup BOOLEAN NOT NULL DEFAULT false,
  show_in_banner BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER NOT NULL DEFAULT 0, -- 0 = ilimitado
  uses_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read active coupons"
ON public.coupons
FOR SELECT
TO public
USING (active = true);

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Cupom inicial PRIMEIRA30 (já em uso no exit popup)
INSERT INTO public.coupons (code, label, description, discount_type, discount_value, show_in_checkout, show_in_exit_popup, show_in_banner)
VALUES ('PRIMEIRA30', 'R$30 OFF na 1ª mensalidade', 'Desconto de boas-vindas para novos clientes', 'fixed', 3000, true, true, false);