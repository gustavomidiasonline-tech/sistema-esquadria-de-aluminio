
CREATE TABLE public.servico_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL,
  concluida BOOLEAN NOT NULL DEFAULT false,
  concluida_em TIMESTAMP WITH TIME ZONE,
  concluida_por UUID,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(servico_id, etapa)
);

ALTER TABLE public.servico_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view servico_checklist"
ON public.servico_checklist FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can manage servico_checklist"
ON public.servico_checklist FOR ALL TO authenticated
USING (true);
