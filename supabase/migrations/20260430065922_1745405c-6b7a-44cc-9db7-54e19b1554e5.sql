-- Tabela de catálogo/whitelist de serviços RBX de atendimento
CREATE TABLE public.rbx_service_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL CHECK (version IN ('v1','v2')),
  service_slug text NOT NULL,
  service_label text NOT NULL DEFAULT '',
  service_type text NOT NULL DEFAULT 'leitura' CHECK (service_type IN ('leitura','escrita')),
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  last_test_at timestamptz,
  last_test_status text,
  last_test_error text,
  last_test_latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version, service_slug)
);

ALTER TABLE public.rbx_service_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rbx_service_permissions"
  ON public.rbx_service_permissions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_rbx_service_permissions_updated_at
  BEFORE UPDATE ON public.rbx_service_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed v1 (8 serviços de atendimento - documentação oficial)
INSERT INTO public.rbx_service_permissions (version, service_slug, service_label, service_type, sort_order) VALUES
  ('v1','AtendimentoCadastro','Cadastro de atendimentos','escrita',1),
  ('v1','ConsultaAtendimentos','Consulta atendimentos','leitura',2),
  ('v1','ConsultaCausas','Consulta causas de atendimentos','leitura',3),
  ('v1','ConsultaChecklistAtendimentos','Consulta checklist de atendimentos','leitura',4),
  ('v1','ConsultaFluxos','Consulta fluxos de atendimentos','leitura',5),
  ('v1','ConsultaGruposSLA','Consulta grupos de SLA','leitura',6),
  ('v1','ConsultaOcorrenciasAtendimentos','Consulta ocorrências de atendimentos','leitura',7),
  ('v1','ConsultaTopicos','Consulta tópicos de atendimentos','leitura',8);

-- Seed v2 (14 serviços de atendimento - documentação oficial)
INSERT INTO public.rbx_service_permissions (version, service_slug, service_label, service_type, sort_order) VALUES
  ('v2','ticket_appointment_update','Alteração de agendamento no atendimento','escrita',1),
  ('v2','ticket_update','Alteração de atendimentos','escrita',2),
  ('v2','ticket_checklist_update','Alteração de checklist de atendimentos','escrita',3),
  ('v2','ticket_os_status_update','Alteração de situação da OS','escrita',4),
  ('v2','consult_appointments','Consulta horários disponíveis para agendamento','leitura',5),
  ('v2','get_tickets_mode','Consulta modos de atendimento','leitura',6),
  ('v2','ticket_assign','Designação de atendimento','escrita',7),
  ('v2','ticket_finish','Encerramento de atendimento','escrita',8),
  ('v2','generate_questionare_link','Geração de link para pesquisa de satisfação','escrita',9),
  ('v2','appointment_insert','Inclusão de agendamento avulso','escrita',10),
  ('v2','ticket_appointment_insert','Inclusão de agendamento no atendimento','escrita',11),
  ('v2','ticket_item_insert','Inclusão de item em atendimento','escrita',12),
  ('v2','ticket_message_insert','Inclusão de mensagens no atendimento','escrita',13),
  ('v2','ticket_occurrence_insert','Inclusão de ocorrência em atendimento','escrita',14);