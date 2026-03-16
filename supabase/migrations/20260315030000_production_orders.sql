-- ============================================================
-- Migration: Ordens de Produção
-- Story: 3.3 — Tabela production_orders + Flow de Produção
-- Data: 2026-03-15
-- ============================================================

-- 1. Ordens de produção
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id),
  numero TEXT NOT NULL,  -- OP-2026-001
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aguardando_material', 'em_producao', 'qualidade', 'pronto', 'entregue', 'cancelada')),
  data_inicio_prevista DATE,
  data_entrega_prevista DATE,
  data_inicio_real TIMESTAMPTZ,
  data_conclusao_real TIMESTAMPTZ,
  responsavel_id UUID REFERENCES public.profiles(id),
  observacoes TEXT,
  plano_corte_gerado BOOLEAN NOT NULL DEFAULT false,
  prioridade TEXT NOT NULL DEFAULT 'normal'
    CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_production_orders_updated_at
  BEFORE UPDATE ON public.production_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_prod_orders_company ON public.production_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_pedido ON public.production_orders(pedido_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_status ON public.production_orders(status);
CREATE INDEX IF NOT EXISTS idx_prod_orders_entrega ON public.production_orders(data_entrega_prevista);

-- 2. Itens da ordem de produção (peças individuais)
CREATE TABLE IF NOT EXISTS public.production_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  pedido_item_id UUID REFERENCES public.pedido_itens(id),
  window_part_id UUID REFERENCES public.window_parts(id),
  perfil_aluminio_id UUID REFERENCES public.perfis_aluminio(id),
  posicao TEXT,
  comprimento_mm NUMERIC NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'cortado', 'montado', 'concluido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_prod_order_items_order ON public.production_order_items(production_order_id);

-- 3. Lista de materiais calculada
CREATE TABLE IF NOT EXISTS public.materials_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  production_order_id UUID REFERENCES public.production_orders(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  -- Material pode ser perfil, vidro, ferragem ou acessório
  perfil_aluminio_id UUID REFERENCES public.perfis_aluminio(id),
  glass_type_id UUID REFERENCES public.glass_types(id),
  hardware_id UUID REFERENCES public.hardware(id),
  accessory_id UUID REFERENCES public.accessories(id),
  descricao TEXT NOT NULL,
  quantidade NUMERIC NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  custo_total NUMERIC GENERATED ALWAYS AS (ROUND(quantidade * custo_unitario, 2)) STORED,
  disponivel_estoque BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materials_list ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_materials_company ON public.materials_list(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_prod_order ON public.materials_list(production_order_id);

-- 4. Etapas de produção (workflow flexível)
CREATE TABLE IF NOT EXISTS public.production_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),  -- NULL = etapa global
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  tempo_previsto_min INTEGER,
  requer_confirmacao BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;

-- 5. Progresso por etapa em cada OP
CREATE TABLE IF NOT EXISTS public.production_stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.production_stages(id),
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'pulado')),
  iniciado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  responsavel_id UUID REFERENCES public.profiles(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_stage_progress ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "company_production_orders" ON public.production_orders
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "company_production_items" ON public.production_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.production_orders po
      WHERE po.id = production_order_id
        AND po.company_id = get_user_company_id()
    )
  );

CREATE POLICY "company_materials_list" ON public.materials_list
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "see_global_and_company_stages" ON public.production_stages
  FOR SELECT USING (company_id IS NULL OR company_id = get_user_company_id());

CREATE POLICY "company_stage_progress" ON public.production_stage_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.production_orders po
      WHERE po.id = production_order_id
        AND po.company_id = get_user_company_id()
    )
  );

-- 7. Trigger: auto-criar production_order quando pedido é aprovado
CREATE OR REPLACE FUNCTION public.handle_pedido_aprovado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_numero TEXT;
  v_ano TEXT;
  v_seq INTEGER;
BEGIN
  -- Só atua quando status muda para 'em_producao'
  IF NEW.status = 'em_producao' AND OLD.status != 'em_producao' THEN
    -- Obter company_id do pedido
    v_company_id := NEW.company_id;

    -- Gerar número único da OP
    v_ano := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO v_seq
    FROM public.production_orders
    WHERE company_id = v_company_id
      AND numero LIKE 'OP-' || v_ano || '-%';

    v_numero := 'OP-' || v_ano || '-' || LPAD(v_seq::TEXT, 4, '0');

    -- Criar ordem de produção
    INSERT INTO public.production_orders (
      company_id,
      pedido_id,
      numero,
      status,
      data_entrega_prevista
    ) VALUES (
      v_company_id,
      NEW.id,
      v_numero,
      'pendente',
      NEW.data_entrega
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_pedido_aprovado
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION handle_pedido_aprovado();

-- 8. Seed: Etapas de produção padrão (globais)
INSERT INTO public.production_stages (nome, descricao, ordem, tempo_previsto_min, requer_confirmacao) VALUES
  ('Separação de Material', 'Separar perfis, vidros e ferragens do estoque', 1, 30, false),
  ('Plano de Corte', 'Executar cortes conforme plano otimizado de barras', 2, 60, true),
  ('Montagem do Marco', 'Montar o marco externo da esquadria', 3, 45, false),
  ('Montagem das Folhas', 'Montar as folhas (quadros internos)', 4, 60, false),
  ('Vidraçaria', 'Inserir vidros e aplicar vedação', 5, 45, false),
  ('Ferragens', 'Instalar fechaduras, puxadores, trilhos e roldanas', 6, 30, false),
  ('Controle de Qualidade', 'Verificar dimensões, acabamento e funcionamento correto', 7, 20, true),
  ('Embalagem', 'Embalar com proteção e identificar com etiqueta do pedido', 8, 15, false)
ON CONFLICT DO NOTHING;
