-- ============================================================
-- SCRIPT CONSOLIDADO: Tabelas e funções faltando no Supabase
-- Execute este script INTEIRO no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/vakfmjdbmlzuoenqpquc/sql
-- ============================================================

-- ============================================================
-- PARTE 1: Adicionar coluna email em companies (se não existir)
-- ============================================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================================
-- PARTE 2: cutting_plans — planos de corte
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cutting_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  production_order_id UUID REFERENCES public.production_orders(id),
  numero TEXT NOT NULL,
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_cutting_plans_all' AND tablename = 'cutting_plans') THEN
    CREATE POLICY "company_cutting_plans_all" ON public.cutting_plans
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
END $$;

-- ============================================================
-- PARTE 3: cutting_pieces — peças calculadas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cutting_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cutting_plan_id UUID NOT NULL REFERENCES public.cutting_plans(id) ON DELETE CASCADE,
  perfil_codigo TEXT,
  perfil_nome TEXT,
  posicao TEXT NOT NULL,
  comprimento_mm NUMERIC NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  formula_usada TEXT,
  orcamento_item_id UUID REFERENCES public.orcamento_itens(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cutting_pieces ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cutting_pieces_plan ON public.cutting_pieces(cutting_plan_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_cutting_pieces_all' AND tablename = 'cutting_pieces') THEN
    CREATE POLICY "company_cutting_pieces_all" ON public.cutting_pieces
      USING (cutting_plan_id IN (SELECT id FROM public.cutting_plans WHERE company_id = get_user_company_id()))
      WITH CHECK (cutting_plan_id IN (SELECT id FROM public.cutting_plans WHERE company_id = get_user_company_id()));
  END IF;
END $$;

-- ============================================================
-- PARTE 4: cutting_bars — barras otimizadas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cutting_bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cutting_plan_id UUID NOT NULL REFERENCES public.cutting_plans(id) ON DELETE CASCADE,
  numero_barra INTEGER NOT NULL,
  comprimento_total_mm NUMERIC NOT NULL DEFAULT 6000,
  sobra_mm NUMERIC NOT NULL DEFAULT 0,
  aproveitamento_pct NUMERIC NOT NULL DEFAULT 0,
  cortes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cutting_bars ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cutting_bars_plan ON public.cutting_bars(cutting_plan_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_cutting_bars_all' AND tablename = 'cutting_bars') THEN
    CREATE POLICY "company_cutting_bars_all" ON public.cutting_bars
      USING (cutting_plan_id IN (SELECT id FROM public.cutting_plans WHERE company_id = get_user_company_id()))
      WITH CHECK (cutting_plan_id IN (SELECT id FROM public.cutting_plans WHERE company_id = get_user_company_id()));
  END IF;
END $$;

-- ============================================================
-- PARTE 5: inventory_items — estoque de materiais
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
  quantidade_minima NUMERIC NOT NULL DEFAULT 0,
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  localizacao TEXT,
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_inventory_select' AND tablename = 'inventory_items') THEN
    CREATE POLICY "company_inventory_select" ON public.inventory_items FOR SELECT USING (company_id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_inventory_insert' AND tablename = 'inventory_items') THEN
    CREATE POLICY "company_inventory_insert" ON public.inventory_items FOR INSERT WITH CHECK (company_id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_inventory_update' AND tablename = 'inventory_items') THEN
    CREATE POLICY "company_inventory_update" ON public.inventory_items FOR UPDATE USING (company_id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_inventory_delete' AND tablename = 'inventory_items') THEN
    CREATE POLICY "company_inventory_delete" ON public.inventory_items FOR DELETE USING (company_id = get_user_company_id());
  END IF;
END $$;

-- ============================================================
-- PARTE 6: purchase_orders — pedidos de compra
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  production_order_id UUID REFERENCES public.production_orders(id),
  numero TEXT NOT NULL,
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_purchase_orders_select' AND tablename = 'purchase_orders') THEN
    CREATE POLICY "company_purchase_orders_select" ON public.purchase_orders FOR SELECT USING (company_id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_purchase_orders_insert' AND tablename = 'purchase_orders') THEN
    CREATE POLICY "company_purchase_orders_insert" ON public.purchase_orders FOR INSERT WITH CHECK (company_id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_purchase_orders_update' AND tablename = 'purchase_orders') THEN
    CREATE POLICY "company_purchase_orders_update" ON public.purchase_orders FOR UPDATE USING (company_id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_purchase_orders_delete' AND tablename = 'purchase_orders') THEN
    CREATE POLICY "company_purchase_orders_delete" ON public.purchase_orders FOR DELETE USING (company_id = get_user_company_id());
  END IF;
END $$;

-- ============================================================
-- PARTE 7: purchase_order_items — itens do pedido de compra
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_po_items_all' AND tablename = 'purchase_order_items') THEN
    CREATE POLICY "company_po_items_all" ON public.purchase_order_items
      USING (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE company_id = get_user_company_id()))
      WITH CHECK (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE company_id = get_user_company_id()));
  END IF;
END $$;

-- ============================================================
-- PARTE 8: ai_import_jobs — importação de catálogos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  nome_arquivo TEXT NOT NULL,
  fabricante TEXT,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'processando', 'concluido', 'erro', 'revisao')),
  perfis_encontrados INTEGER DEFAULT 0,
  modelos_encontrados INTEGER DEFAULT 0,
  componentes_encontrados INTEGER DEFAULT 0,
  regras_encontradas INTEGER DEFAULT 0,
  ai_raw_output JSONB,
  erro_mensagem TEXT,
  dados_para_import JSONB,
  confirmado_por UUID REFERENCES public.profiles(id),
  confirmado_em TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_import_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ai_import_company ON public.ai_import_jobs(company_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_ai_import_select' AND tablename = 'ai_import_jobs') THEN
    CREATE POLICY "company_ai_import_select" ON public.ai_import_jobs FOR SELECT USING (company_id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_ai_import_insert' AND tablename = 'ai_import_jobs') THEN
    CREATE POLICY "company_ai_import_insert" ON public.ai_import_jobs FOR INSERT WITH CHECK (company_id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_ai_import_update' AND tablename = 'ai_import_jobs') THEN
    CREATE POLICY "company_ai_import_update" ON public.ai_import_jobs FOR UPDATE USING (company_id = get_user_company_id());
  END IF;
END $$;

-- ============================================================
-- PARTE 9: Triggers de updated_at
-- ============================================================
CREATE OR REPLACE TRIGGER update_cutting_plans_updated_at
  BEFORE UPDATE ON public.cutting_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_ai_import_jobs_updated_at
  BEFORE UPDATE ON public.ai_import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PARTE 10: Trigger — orçamento aprovado cria plano de corte
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
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
    v_company_id := NEW.company_id;

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

DROP TRIGGER IF EXISTS trigger_orcamento_aprovado ON public.orcamentos;
CREATE TRIGGER trigger_orcamento_aprovado
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION handle_orcamento_aprovado();

-- ============================================================
-- PARTE 11: handle_new_user — corrigido com coluna email
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  IF v_company_id IS NULL THEN
    v_company_name := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      'Empresa de ' || COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)
    );

    INSERT INTO public.companies (nome, email)
    VALUES (v_company_name, NEW.email)
    RETURNING id INTO v_company_id;
  END IF;

  INSERT INTO public.profiles (user_id, nome, email, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    v_company_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    company_id = COALESCE(profiles.company_id, EXCLUDED.company_id);

  RETURN NEW;
END;
$$;

-- ============================================================
-- PARTE 12: auto_provision_company() — RPC para AuthContext
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_provision_company()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_nome text;
  v_email text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT company_id, nome, email INTO v_company_id, v_nome, v_email
  FROM profiles
  WHERE user_id = v_user_id;

  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;

  INSERT INTO companies (nome, email)
  VALUES (COALESCE(v_nome, 'Minha Empresa'), v_email)
  RETURNING id INTO v_company_id;

  UPDATE profiles
  SET company_id = v_company_id
  WHERE user_id = v_user_id;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION auto_provision_company() TO authenticated;

-- ============================================================
-- PARTE 13: Policy para criar primeira empresa
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_can_create_first_company' AND tablename = 'companies'
  ) THEN
    CREATE POLICY "users_can_create_first_company"
      ON public.companies FOR INSERT TO authenticated
      WITH CHECK (
        NOT EXISTS (
          SELECT 1 FROM profiles WHERE user_id = auth.uid() AND company_id IS NOT NULL
        )
      );
  END IF;
END $$;

-- ============================================================
-- FINALIZADO! Verifique se todas as tabelas foram criadas:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- ============================================================
