ALTER TABLE public.combo_options ADD COLUMN IF NOT EXISTS recommended boolean NOT NULL DEFAULT false;

-- Garantir no máximo 1 opção recomendada por categoria
CREATE OR REPLACE FUNCTION public.enforce_single_recommended_combo_option()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.recommended = true THEN
    UPDATE public.combo_options
    SET recommended = false
    WHERE category = NEW.category
      AND id <> NEW.id
      AND recommended = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_recommended_combo_option ON public.combo_options;
CREATE TRIGGER trg_single_recommended_combo_option
BEFORE INSERT OR UPDATE OF recommended ON public.combo_options
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_recommended_combo_option();