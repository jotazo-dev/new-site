
-- 1) Storage: drop broad SELECT (listing) policies on public buckets.
-- Public file delivery via /object/public/ bypasses RLS and keeps working.
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view site assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read testimonials bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read testimonials photos" ON storage.objects;

-- 2) eai_token_cache: admin-only read
DROP POLICY IF EXISTS "eai_token_cache admin read" ON public.eai_token_cache;
CREATE POLICY "eai_token_cache admin read"
  ON public.eai_token_cache
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Coupons: remove public read of full row; expose safe RPCs.
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal_cents integer DEFAULT 0)
RETURNS TABLE(code text, label text, discount_cents integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  norm text := upper(trim(coalesce(_code, '')));
BEGIN
  IF length(norm) = 0 THEN RETURN; END IF;
  SELECT * INTO c FROM public.coupons
    WHERE upper(coupons.code) = norm
      AND active = true
      AND show_in_checkout = true
    LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN RETURN; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RETURN; END IF;
  IF c.max_uses > 0 AND c.uses_count >= c.max_uses THEN RETURN; END IF;
  code := c.code;
  label := COALESCE(NULLIF(c.label, ''), c.code);
  IF c.discount_type = 'percent' THEN
    discount_cents := ((COALESCE(_subtotal_cents,0) * c.discount_value) / 100)::int;
  ELSE
    discount_cents := c.discount_value::int;
  END IF;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_coupon_for(_placement text)
RETURNS TABLE(code text, label text, discount_cents integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  col text;
BEGIN
  col := CASE _placement
    WHEN 'exit_popup' THEN 'show_in_exit_popup'
    WHEN 'banner' THEN 'show_in_banner'
    ELSE 'show_in_checkout'
  END;
  FOR c IN EXECUTE format(
    'SELECT * FROM public.coupons WHERE active = true AND %I = true ORDER BY sort_order ASC LIMIT 5', col
  ) LOOP
    IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN CONTINUE; END IF;
    IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN CONTINUE; END IF;
    IF c.max_uses > 0 AND c.uses_count >= c.max_uses THEN CONTINUE; END IF;
    code := c.code;
    label := COALESCE(NULLIF(c.label, ''), c.code);
    discount_cents := 0; -- placement previews don't compute on subtotal
    RETURN NEXT;
    RETURN;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_coupon_for(text) TO anon, authenticated;
