DROP POLICY IF EXISTS "Admins manage commercial_proposals" ON public.commercial_proposals;

CREATE POLICY "Propostas section can read"
ON public.commercial_proposals FOR SELECT TO authenticated
USING (has_section_permission(auth.uid(), 'propostas'));

CREATE POLICY "Propostas section can insert"
ON public.commercial_proposals FOR INSERT TO authenticated
WITH CHECK (has_section_permission(auth.uid(), 'propostas'));

CREATE POLICY "Propostas section can update"
ON public.commercial_proposals FOR UPDATE TO authenticated
USING (has_section_permission(auth.uid(), 'propostas'))
WITH CHECK (has_section_permission(auth.uid(), 'propostas'));

CREATE POLICY "Propostas section can delete"
ON public.commercial_proposals FOR DELETE TO authenticated
USING (has_section_permission(auth.uid(), 'propostas'));