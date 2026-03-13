
-- Create agenda_eventos table
CREATE TABLE public.agenda_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'compromisso',
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  dia_inteiro BOOLEAN NOT NULL DEFAULT false,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  responsavel TEXT,
  endereco TEXT,
  cor TEXT DEFAULT '#3b82f6',
  status TEXT NOT NULL DEFAULT 'agendado',
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view agenda_eventos"
  ON public.agenda_eventos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage agenda_eventos"
  ON public.agenda_eventos FOR ALL
  TO authenticated
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_agenda_eventos_updated_at
  BEFORE UPDATE ON public.agenda_eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
