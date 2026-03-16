-- ============================================================
-- Migration: Modelos de Esquadrias e Peças
-- Story: 3.2 — Tabelas window_models + window_parts
-- Data: 2026-03-15
-- ============================================================

-- 1. Modelos de esquadrias (templates parametrizáveis)
CREATE TABLE IF NOT EXISTS public.window_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),  -- NULL = modelo global (sistema)
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL
    CHECK (tipo IN ('correr', 'basculante', 'maxim-ar', 'fixo', 'pivotante', 'giro', 'balcao', 'camarao')),
  num_folhas INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  largura_min NUMERIC DEFAULT 300,
  largura_max NUMERIC DEFAULT 6000,
  altura_min NUMERIC DEFAULT 300,
  altura_max NUMERIC DEFAULT 4000,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.window_models ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_window_models_updated_at
  BEFORE UPDATE ON public.window_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_window_models_company_id ON public.window_models(company_id);
CREATE INDEX IF NOT EXISTS idx_window_models_tipo ON public.window_models(tipo);

-- 2. Peças de cada modelo (perfis necessários com fórmulas)
CREATE TABLE IF NOT EXISTS public.window_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_model_id UUID NOT NULL REFERENCES public.window_models(id) ON DELETE CASCADE,
  perfil_aluminio_id UUID REFERENCES public.perfis_aluminio(id),
  posicao TEXT NOT NULL,
  -- Fórmulas: variáveis disponíveis: largura, altura, num_folhas, folga (padrão 10mm)
  -- Exemplos: 'largura', 'altura - 40', 'largura / num_folhas + 30'
  formula_comprimento TEXT NOT NULL,
  quantidade_formula TEXT NOT NULL DEFAULT '1',  -- pode ser fórmula: 'num_folhas * 2'
  observacao TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.window_parts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_window_parts_model_id ON public.window_parts(window_model_id);

-- 3. Tipos de vidro
CREATE TABLE IF NOT EXISTS public.glass_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  espessura_mm NUMERIC NOT NULL DEFAULT 4,
  tipo TEXT DEFAULT 'comum'
    CHECK (tipo IN ('comum', 'temperado', 'laminado', 'insulado', 'refletivo', 'fumê')),
  cor TEXT DEFAULT 'incolor',
  preco_m2 NUMERIC NOT NULL DEFAULT 0,
  fornecedor TEXT,
  peso_m2_kg NUMERIC,  -- para cálculo de peso
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.glass_types ENABLE ROW LEVEL SECURITY;

-- 4. Ferragens
CREATE TABLE IF NOT EXISTS public.hardware (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT
    CHECK (tipo IN ('fechadura', 'dobradica', 'puxador', 'trilho', 'roldana', 'cremona', 'espagnolette', 'outro')),
  descricao TEXT,
  unidade TEXT NOT NULL DEFAULT 'un',
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  fornecedor TEXT,
  peso_unitario_kg NUMERIC,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hardware ENABLE ROW LEVEL SECURITY;

-- 5. Acessórios gerais
CREATE TABLE IF NOT EXISTS public.accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT,
  descricao TEXT,
  unidade TEXT NOT NULL DEFAULT 'un',
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  fornecedor TEXT,
  peso_unitario_kg NUMERIC,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — window_models (global + empresa)
CREATE POLICY "see_global_and_company_models" ON public.window_models
  FOR SELECT USING (
    company_id IS NULL  -- modelos globais do sistema
    OR company_id = get_user_company_id()
  );

CREATE POLICY "company_manage_window_models" ON public.window_models
  FOR ALL USING (company_id = get_user_company_id());

-- window_parts segue o model
CREATE POLICY "see_window_parts" ON public.window_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.window_models wm
      WHERE wm.id = window_model_id
        AND (wm.company_id IS NULL OR wm.company_id = get_user_company_id())
    )
  );

-- glass_types
CREATE POLICY "see_global_and_company_glass" ON public.glass_types
  FOR SELECT USING (company_id IS NULL OR company_id = get_user_company_id());

CREATE POLICY "manage_company_glass" ON public.glass_types
  FOR ALL USING (company_id = get_user_company_id());

-- hardware
CREATE POLICY "see_global_and_company_hardware" ON public.hardware
  FOR SELECT USING (company_id IS NULL OR company_id = get_user_company_id());

CREATE POLICY "manage_company_hardware" ON public.hardware
  FOR ALL USING (company_id = get_user_company_id());

-- accessories
CREATE POLICY "see_global_and_company_accessories" ON public.accessories
  FOR SELECT USING (company_id IS NULL OR company_id = get_user_company_id());

CREATE POLICY "manage_company_accessories" ON public.accessories
  FOR ALL USING (company_id = get_user_company_id());

-- ============================================================
-- SEED DATA: Modelos de Esquadrias Padrão (company_id = NULL = global)
-- ============================================================

INSERT INTO public.window_models (codigo, nome, tipo, num_folhas, descricao, largura_min, largura_max, altura_min, altura_max) VALUES
  ('JC2F', 'Janela Correr 2 Folhas', 'correr', 2, 'Janela de correr com 2 folhas, trilho duplo', 600, 3600, 500, 2400),
  ('JC4F', 'Janela Correr 4 Folhas', 'correr', 4, 'Janela de correr com 4 folhas, trilho duplo', 1200, 5000, 500, 2400),
  ('JBL',  'Janela Basculante', 'basculante', 1, 'Janela basculante com múltiplas folhas', 400, 2000, 400, 1500),
  ('JMX',  'Janela Maxim-Ar', 'maxim-ar', 1, 'Janela maxim-ar com folhas inclinadas', 400, 2000, 400, 2000),
  ('JFX',  'Janela Fixa', 'fixo', 1, 'Janela sem abertura, apenas quadro', 200, 4000, 200, 3000),
  ('JPT',  'Porta de Correr', 'correr', 2, 'Porta de correr 2 folhas com vidro', 800, 4000, 2000, 2800)
ON CONFLICT DO NOTHING;

-- Peças para JC2F (Janela Correr 2 Folhas)
WITH jc2f AS (SELECT id FROM public.window_models WHERE codigo = 'JC2F' LIMIT 1)
INSERT INTO public.window_parts (window_model_id, posicao, formula_comprimento, quantidade_formula, sort_order)
SELECT
  jc2f.id,
  posicao,
  formula_comprimento,
  quantidade_formula,
  sort_order
FROM jc2f,
(VALUES
  ('marco_horizontal_superior', 'largura', '1', 1),
  ('marco_horizontal_inferior', 'largura', '1', 2),
  ('marco_vertical_esquerdo', 'altura - 20', '1', 3),
  ('marco_vertical_direito', 'altura - 20', '1', 4),
  ('trilho_superior', 'largura', '1', 5),
  ('trilho_inferior', 'largura', '1', 6),
  ('folha_horizontal_superior', 'largura / num_folhas + 30', 'num_folhas', 7),
  ('folha_horizontal_inferior', 'largura / num_folhas + 30', 'num_folhas', 8),
  ('folha_vertical_esquerda', 'altura - 80', 'num_folhas', 9),
  ('folha_vertical_direita', 'altura - 80', 'num_folhas', 10)
) AS t(posicao, formula_comprimento, quantidade_formula, sort_order)
ON CONFLICT DO NOTHING;

-- Peças para JFX (Janela Fixa)
WITH jfx AS (SELECT id FROM public.window_models WHERE codigo = 'JFX' LIMIT 1)
INSERT INTO public.window_parts (window_model_id, posicao, formula_comprimento, quantidade_formula, sort_order)
SELECT
  jfx.id,
  posicao,
  formula_comprimento,
  quantidade_formula,
  sort_order
FROM jfx,
(VALUES
  ('marco_horizontal_superior', 'largura', '1', 1),
  ('marco_horizontal_inferior', 'largura', '1', 2),
  ('marco_vertical_esquerdo', 'altura', '1', 3),
  ('marco_vertical_direito', 'altura', '1', 4)
) AS t(posicao, formula_comprimento, quantidade_formula, sort_order)
ON CONFLICT DO NOTHING;
