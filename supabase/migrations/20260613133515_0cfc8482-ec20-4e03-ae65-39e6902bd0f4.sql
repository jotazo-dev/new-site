
CREATE TABLE public.mvno_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  subject text NOT NULL DEFAULT '',
  header_title text NOT NULL DEFAULT 'JOTAZO TELECOM',
  intro_html text NOT NULL DEFAULT '',
  footer_html text NOT NULL DEFAULT '',
  signature_html text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#0B4189',
  accent_color text NOT NULL DEFAULT '#F47F1B',
  logo_url text,
  pdf_header_text text NOT NULL DEFAULT 'Comprovante de contratação de linha móvel',
  pdf_footer_text text NOT NULL DEFAULT 'Jotazo Telecom · esim@jotazo.com · jotazo.com.br',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mvno_email_templates TO authenticated;
GRANT ALL ON public.mvno_email_templates TO service_role;

ALTER TABLE public.mvno_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mvno templates read" ON public.mvno_email_templates
  FOR SELECT TO authenticated
  USING (public.has_section_permission(auth.uid(), 'esim'));

CREATE POLICY "mvno templates write" ON public.mvno_email_templates
  FOR ALL TO authenticated
  USING (public.has_section_permission(auth.uid(), 'esim'))
  WITH CHECK (public.has_section_permission(auth.uid(), 'esim'));

CREATE TRIGGER trg_mvno_email_templates_updated_at
  BEFORE UPDATE ON public.mvno_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mvno_email_templates (slug, subject, header_title, intro_html, footer_html, signature_html, pdf_header_text)
VALUES
  ('activation_sim',
    'Sua linha Jotazo foi contratada — {{tn}}',
    'JOTAZO TELECOM',
    '<p>Olá <strong>{{primeiro_nome}}</strong>,</p><p>Confirmamos a contratação da sua linha móvel Jotazo. Em breve seu chip físico (SIM Card) será disponibilizado para retirada/envio.</p>',
    'Os detalhes completos da sua linha estão no PDF anexo.',
    'Equipe Jotazo Telecom',
    'Comprovante de contratação de linha móvel'),
  ('activation_esim',
    'Seu eSIM Jotazo está pronto — {{tn}}',
    'JOTAZO TELECOM',
    '<p>Olá <strong>{{primeiro_nome}}</strong>,</p><p>Confirmamos a contratação da sua linha móvel Jotazo. Como você escolheu <strong>eSIM</strong>, o QR Code de ativação está anexado em PDF a este e-mail.</p>',
    'Abra o PDF anexo para visualizar o QR Code e o passo a passo de instalação.',
    'Equipe Jotazo Telecom',
    'Ativação do seu eSIM');
