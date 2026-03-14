
-- 1. Workflow Templates (configurável por empresa)
CREATE TABLE public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'clipboard-check',
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('medidas', 'checklist_materiais', 'upload_fotos', 'texto_livre', 'data_confirmacao')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Order Progress (progresso de cada pedido por etapa)
CREATE TABLE public.order_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES public.workflow_templates(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pedido_id, stage_id)
);

-- RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_progress ENABLE ROW LEVEL SECURITY;

-- Workflow templates: authenticated users can view, admins can manage
CREATE POLICY "Auth view workflow_templates"
  ON public.workflow_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin manage workflow_templates"
  ON public.workflow_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Order progress: authenticated users can view and manage
CREATE POLICY "Auth view order_progress"
  ON public.order_progress FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Auth manage order_progress"
  ON public.order_progress FOR ALL TO authenticated
  USING (true);

-- Seed default workflow templates (company_id NULL = system defaults)
INSERT INTO public.workflow_templates (name, icon, field_type, sort_order) VALUES
  ('Conferir Medidas', 'ruler', 'medidas', 1),
  ('Solicitar Materiais', 'shopping-cart', 'checklist_materiais', 2),
  ('Recebimento', 'package-check', 'checklist_materiais', 3),
  ('Instalação', 'wrench', 'data_confirmacao', 4),
  ('Conferência da Obra', 'clipboard-check', 'texto_livre', 5);
