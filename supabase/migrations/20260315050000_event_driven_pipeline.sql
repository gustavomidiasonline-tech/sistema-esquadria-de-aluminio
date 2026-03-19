-- ============================================================
-- Migration: Event-Driven Pipeline Tables
-- Story: 4.1 — Pipeline orçamento → produção (event-driven)
-- Data: 2026-03-15
-- ============================================================

-- ============================================================
-- 1. cutting_plans — container do plano de corte
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cutting_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  production_order_id UUID REFERENCES public.production_orders(id),
  numero TEXT NOT NULL,              -- CP-2026-001
  algoritmo TEXT NOT NULL DEFAULT 'BFD'
    CHECK (algoritmo IN ('FFD', 'BFD')),
  comprimento_barra_mm NUMERIC NOT NULL DEFAULT 6000,
  total_barras INTEGER DEFAULT 0,
  total_pecas INTEGER DEFAULT 0,
  sobra_total_mm NUMERIC DEFAULT 0,
  aproveitamento_medio NUMERIC DEFAULT 0,
  barras_json JSONB,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'calculando', 'gerado', 'pronto', 'executado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cutting_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cutting_plans_company ON public.cutting_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_cutting_plans_orcamento ON public.cutting_plans(orcamento_id);

CREATE POLICY "company_cutting_plans_all" ON public.cutting_plans
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

-- ============================================================
-- 2. cutting_pieces — peças calculadas para cada plano
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cutting_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cutting_plan_id UUID NOT NULL REFERENCES public.cutting_plans(id) ON DELETE CASCADE,
  perfil_codigo TEXT,
  perfil_nome TEXT,
  posicao TEXT NOT NULL,             -- marco_horizontal, folha_vertical, etc
  comprimento_mm NUMERIC NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  formula_usada TEXT,                -- ex: 'largura - 40'
  orcamento_item_id UUID REFERENCES public.orcamento_itens(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cutting_pieces ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cutting_pieces_plan ON public.cutting_pieces(cutting_plan_id);

CREATE POLICY "company_cutting_pieces_all" ON public.cutting_pieces
  USING (
    cutting_plan_id IN (
      SELECT id FROM public.cutting_plans
      WHERE company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    cutting_plan_id IN (
      SELECT id FROM public.cutting_plans
      WHERE company_id = get_user_company_id()
    )
  );

-- ============================================================
-- 3. cutting_bars — barras resultantes do plano otimizado
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cutting_bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cutting_plan_id UUID NOT NULL REFERENCES public.cutting_plans(id) ON DELETE CASCADE,
  numero_barra INTEGER NOT NULL,
  comprimento_total_mm NUMERIC NOT NULL DEFAULT 6000,
  sobra_mm NUMERIC NOT NULL DEFAULT 0,
  aproveitamento_pct NUMERIC NOT NULL DEFAULT 0,
  -- cuts é armazenado como JSONB para preservar estrutura do algoritmo
  cortes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cutting_bars ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cutting_bars_plan ON public.cutting_bars(cutting_plan_id);

CREATE POLICY "company_cutting_bars_all" ON public.cutting_bars
  USING (
    cutting_plan_id IN (
      SELECT id FROM public.cutting_plans
      WHERE company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    cutting_plan_id IN (
      SELECT id FROM public.cutting_plans
      WHERE company_id = get_user_company_id()
    )
  );

-- ============================================================
-- 4. inventory_items — estoque de materiais
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('perfil', 'vidro', 'ferragem', 'acessorio', 'outro')),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  quantidade_disponivel NUMERIC NOT NULL DEFAULT 0,
  quantidade_reservada NUMERIC NOT NULL DEFAULT 0,
  quantidade_minima NUMERIC NOT NULL DEFAULT 0, -- trigger alerta de reposição
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  localizacao TEXT,                   -- prateleira/seção no estoque físico
  -- FKs opcionais para referenciar catálogo técnico
  perfil_aluminio_id UUID REFERENCES public.perfis_aluminio(id),
  glass_type_id UUID REFERENCES public.glass_types(id),
  hardware_id UUID REFERENCES public.hardware(id),
  accessory_id UUID REFERENCES public.accessories(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, codigo)
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_inventory_company ON public.inventory_items(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tipo ON public.inventory_items(tipo);

CREATE POLICY "company_inventory_select" ON public.inventory_items
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_inventory_insert" ON public.inventory_items
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_inventory_update" ON public.inventory_items
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_inventory_delete" ON public.inventory_items
  FOR DELETE USING (
    company_id = get_user_company_id()
    
  );

-- ============================================================
-- 5. purchase_orders — pedidos de compra automáticos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  production_order_id UUID REFERENCES public.production_orders(id),
  numero TEXT NOT NULL,              -- PC-2026-001
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  status TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho', 'enviado', 'confirmado', 'recebido', 'cancelado')),
  valor_total NUMERIC NOT NULL DEFAULT 0,
  data_prevista_entrega DATE,
  observacoes TEXT,
  gerado_automaticamente BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);

CREATE POLICY "company_purchase_orders_select" ON public.purchase_orders
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_purchase_orders_insert" ON public.purchase_orders
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_purchase_orders_update" ON public.purchase_orders
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_purchase_orders_delete" ON public.purchase_orders
  FOR DELETE USING (
    company_id = get_user_company_id()
    
  );

-- ============================================================
-- 6. purchase_order_items — itens de cada pedido de compra
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  descricao TEXT NOT NULL,
  codigo TEXT,
  codigo_material TEXT,
  quantidade NUMERIC NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  preco_total NUMERIC GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  recebido BOOLEAN NOT NULL DEFAULT false,
  quantidade_recebida NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_po_items_order ON public.purchase_order_items(purchase_order_id);

CREATE POLICY "company_po_items_all" ON public.purchase_order_items
  USING (
    purchase_order_id IN (
      SELECT id FROM public.purchase_orders
      WHERE company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM public.purchase_orders
      WHERE company_id = get_user_company_id()
    )
  );

-- ============================================================
-- 7. ai_import_jobs — jobs de importação de catálogos via IA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  nome_arquivo TEXT NOT NULL,
  fabricante TEXT,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'processando', 'concluido', 'erro', 'revisao')),
  -- Resultados da extração
  perfis_encontrados INTEGER DEFAULT 0,
  modelos_encontrados INTEGER DEFAULT 0,
  componentes_encontrados INTEGER DEFAULT 0,
  regras_encontradas INTEGER DEFAULT 0,
  -- Raw output da IA (para auditoria)
  ai_raw_output JSONB,
  -- Erros se houver
  erro_mensagem TEXT,
  -- Dados prontos para import (aguardando confirmação do usuário)
  dados_para_import JSONB,
  -- Status de confirmação
  confirmado_por UUID REFERENCES public.profiles(id),
  confirmado_em TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_import_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ai_import_company ON public.ai_import_jobs(company_id);

CREATE POLICY "company_ai_import_select" ON public.ai_import_jobs
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_ai_import_insert" ON public.ai_import_jobs
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_ai_import_update" ON public.ai_import_jobs
  FOR UPDATE USING (company_id = get_user_company_id());

-- ============================================================
-- 8. Triggers de updated_at
-- ============================================================
CREATE TRIGGER update_cutting_plans_updated_at
  BEFORE UPDATE ON public.cutting_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_import_jobs_updated_at
  BEFORE UPDATE ON public.ai_import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. Trigger: ao aprovar orçamento → criar plano de corte rascunho
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_orcamento_aprovado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_numero TEXT;
  v_seq INTEGER;
BEGIN
  -- Só age quando status muda para 'aprovado'
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
    v_company_id := NEW.company_id;

    -- Gerar número sequencial do plano
    SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)), 0) + 1
    INTO v_seq
    FROM public.cutting_plans
    WHERE company_id = v_company_id
      AND numero LIKE 'CP-' || EXTRACT(YEAR FROM now()) || '-%';

    v_numero := 'CP-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(v_seq::TEXT, 4, '0');

    INSERT INTO public.cutting_plans (company_id, orcamento_id, numero, status)
    VALUES (v_company_id, NEW.id, v_numero, 'pendente');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_orcamento_aprovado
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION handle_orcamento_aprovado();
