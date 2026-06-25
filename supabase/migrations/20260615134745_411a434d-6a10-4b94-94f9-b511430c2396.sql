DROP POLICY IF EXISTS "MVNO section can read activations" ON public.mvno_activations;
DROP POLICY IF EXISTS "MVNO section can insert activations" ON public.mvno_activations;
DROP POLICY IF EXISTS "MVNO section can update activations" ON public.mvno_activations;

CREATE POLICY "Admin panel roles can read mvno activations"
  ON public.mvno_activations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin panel roles can insert mvno activations"
  ON public.mvno_activations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin panel roles can update mvno activations"
  ON public.mvno_activations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
    )
  );