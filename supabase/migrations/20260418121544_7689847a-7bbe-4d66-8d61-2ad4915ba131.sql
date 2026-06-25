-- 1) Novas colunas em crm_leads
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Tabela de atividades
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON public.crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON public.crm_activities(created_at DESC);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read crm_activities" ON public.crm_activities;
CREATE POLICY "Admins can read crm_activities"
  ON public.crm_activities FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert crm_activities" ON public.crm_activities;
CREATE POLICY "Admins can insert crm_activities"
  ON public.crm_activities FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete crm_activities" ON public.crm_activities;
CREATE POLICY "Admins can delete crm_activities"
  ON public.crm_activities FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow trigger-based inserts (system actor) regardless of session
DROP POLICY IF EXISTS "System can insert crm_activities" ON public.crm_activities;
CREATE POLICY "System can insert crm_activities"
  ON public.crm_activities FOR INSERT
  TO public
  WITH CHECK (true);

-- 3) Trigger para registrar mudanças de stage
CREATE OR REPLACE FUNCTION public.log_crm_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.crm_activities (lead_id, type, payload, actor_id)
    VALUES (
      NEW.id,
      'stage_change',
      jsonb_build_object('from', OLD.stage, 'to', NEW.stage),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_stage_change ON public.crm_leads;
CREATE TRIGGER trg_crm_stage_change
  AFTER UPDATE OF stage ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_stage_change();

-- 4) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_activities;