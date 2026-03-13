
-- Create fornecedores table
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  razao_social TEXT,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  contato TEXT,
  categoria TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view fornecedores"
  ON public.fornecedores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage fornecedores"
  ON public.fornecedores FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add fornecedor_id FK to contas_pagar
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL;

-- Create pagamentos table for tracking individual payments
CREATE TABLE public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'entrada',
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  comprovante_url TEXT,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pagamentos"
  ON public.pagamentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage pagamentos"
  ON public.pagamentos FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
