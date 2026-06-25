-- Sequência para número da proposta
CREATE SEQUENCE IF NOT EXISTS public.commercial_proposals_number_seq START 1;

CREATE TABLE public.commercial_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL DEFAULT nextval('public.commercial_proposals_number_seq'),
  status text NOT NULL DEFAULT 'rascunho', -- rascunho | enviada | aceita | recusada | expirada

  -- Cliente
  customer_name text NOT NULL,
  customer_doc text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  customer_cep text NOT NULL DEFAULT '',
  customer_street text NOT NULL DEFAULT '',
  customer_number text NOT NULL DEFAULT '',
  customer_complement text NOT NULL DEFAULT '',
  customer_neighborhood text NOT NULL DEFAULT '',
  customer_city text NOT NULL DEFAULT '',
  customer_uf text NOT NULL DEFAULT '',

  -- Itens da proposta (snapshot)
  items jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Totais (em centavos)
  subtotal_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,

  -- Condições
  fidelity text NOT NULL DEFAULT '12_meses', -- 12_meses | 24_meses | sem_fidelidade
  installation_fee_cents integer NOT NULL DEFAULT 0,
  installation_waived boolean NOT NULL DEFAULT false,
  payment_method text NOT NULL DEFAULT 'boleto', -- boleto | debito_automatico | pix | cartao
  valid_until date,
  notes text NOT NULL DEFAULT '',

  -- Vendedor
  seller_id uuid,
  seller_name text NOT NULL DEFAULT '',
  seller_phone text NOT NULL DEFAULT '',
  seller_email text NOT NULL DEFAULT '',

  -- PDF gerado
  pdf_url text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commercial_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commercial_proposals"
ON public.commercial_proposals
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_commercial_proposals_updated_at
BEFORE UPDATE ON public.commercial_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_commercial_proposals_created_at ON public.commercial_proposals(created_at DESC);
CREATE INDEX idx_commercial_proposals_status ON public.commercial_proposals(status);
CREATE UNIQUE INDEX idx_commercial_proposals_number ON public.commercial_proposals(number);