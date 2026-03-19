-- ============================================================
-- BOOTSTRAP: Criar schema do ERP de Alumínio no Supabase
-- Este script adapta o banco existente (que tem schema jurídico)
-- para suportar o ERP de Esquadrias de Alumínio
--
-- Execute INTEIRO no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vakfmjdbmlzuoenqpquc/sql
-- ============================================================

-- ============================================================
-- PARTE 1: Tabela companies (empresas/tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado VARCHAR(2),
  cep TEXT,
  plano TEXT NOT NULL DEFAULT 'basico'
    CHECK (plano IN ('basico', 'essencial', 'avancado')),
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  max_usuarios INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTE 2: Adicionar colunas faltantes em profiles
-- (sem destruir colunas existentes do app jurídico)
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Criar unique index em user_id se não existir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_user_id_unique') THEN
    CREATE UNIQUE INDEX profiles_user_id_unique ON public.profiles(user_id);
  END IF;
END $$;

-- Preencher user_id e nome dos registros existentes
UPDATE public.profiles p
SET user_id = p.id,
    nome = COALESCE(p.nome, p.full_name, p.email, 'Usuário')
WHERE p.user_id IS NULL;

-- ============================================================
-- PARTE 3: Tabela user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'funcionario',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_see_own_roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "users_see_own_roles" ON public.user_roles
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- PARTE 4: Tabelas de negócio do ERP
-- ============================================================

-- clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf_cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  contato TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  nome TEXT NOT NULL,
  codigo TEXT,
  descricao TEXT,
  preco NUMERIC DEFAULT 0,
  unidade TEXT DEFAULT 'un',
  categoria TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- perfis_aluminio
CREATE TABLE IF NOT EXISTS public.perfis_aluminio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  peso_metro NUMERIC DEFAULT 0,
  preco_metro NUMERIC DEFAULT 0,
  fabricante TEXT,
  linha TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.perfis_aluminio ENABLE ROW LEVEL SECURITY;

-- orcamentos
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  cliente_id UUID REFERENCES public.clientes(id),
  numero TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'rejeitado', 'cancelado')),
  valor_total NUMERIC DEFAULT 0,
  observacoes TEXT,
  validade DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- orcamento_itens
CREATE TABLE IF NOT EXISTS public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  descricao TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  largura_mm NUMERIC,
  altura_mm NUMERIC,
  preco_unitario NUMERIC DEFAULT 0,
  preco_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

-- pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  cliente_id UUID REFERENCES public.clientes(id),
  numero TEXT,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_producao', 'pronto', 'entregue', 'cancelado')),
  valor_total NUMERIC DEFAULT 0,
  data_entrega DATE,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- contas_receber
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  cliente_id UUID REFERENCES public.clientes(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- contas_pagar
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- glass_types, hardware, accessories (catálogo técnico)
CREATE TABLE IF NOT EXISTS public.glass_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  nome TEXT NOT NULL,
  espessura_mm NUMERIC,
  tipo TEXT,
  preco_m2 NUMERIC DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.glass_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.hardware (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  nome TEXT NOT NULL,
  codigo TEXT,
  tipo TEXT,
  preco_unitario NUMERIC DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hardware ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  nome TEXT NOT NULL,
  codigo TEXT,
  tipo TEXT,
  preco_unitario NUMERIC DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

-- production_orders
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  numero TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTE 5: Tabelas de pipeline (cutting, inventory, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cutting_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  production_order_id UUID REFERENCES public.production_orders(id),
  numero TEXT NOT NULL,
  algoritmo TEXT NOT NULL DEFAULT 'BFD',
  comprimento_barra_mm NUMERIC NOT NULL DEFAULT 6000,
  total_barras INTEGER DEFAULT 0,
  total_pecas INTEGER DEFAULT 0,
  sobra_total_mm NUMERIC DEFAULT 0,
  aproveitamento_medio NUMERIC DEFAULT 0,
  barras_json JSONB,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cutting_plans ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  tipo TEXT NOT NULL DEFAULT 'outro',
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  quantidade_disponivel NUMERIC NOT NULL DEFAULT 0,
  quantidade_reservada NUMERIC NOT NULL DEFAULT 0,
  quantidade_minima NUMERIC NOT NULL DEFAULT 0,
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  localizacao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, codigo)
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  numero TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  valor_total NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  gerado_automaticamente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

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
  recebido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  nome_arquivo TEXT NOT NULL,
  fabricante TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
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

-- perfis_catalogo e window_models
CREATE TABLE IF NOT EXISTS public.perfis_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  fabricante TEXT,
  linha TEXT,
  peso_metro NUMERIC,
  preco_metro NUMERIC,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.perfis_catalogo ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.window_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT,
  fabricante TEXT,
  linha TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.window_models ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTE 6: Função helper get_user_company_id()
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- PARTE 7: Função has_role()
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = required_role
  );
$$;

-- ============================================================
-- PARTE 8: RLS Policies para companies
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_see_own_company' AND tablename = 'companies') THEN
    CREATE POLICY "users_see_own_company" ON public.companies
      FOR SELECT USING (id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_manage_own_company' AND tablename = 'companies') THEN
    CREATE POLICY "users_manage_own_company" ON public.companies
      FOR ALL USING (id = get_user_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_can_create_first_company' AND tablename = 'companies') THEN
    CREATE POLICY "users_can_create_first_company" ON public.companies
      FOR INSERT TO authenticated
      WITH CHECK (
        NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id IS NOT NULL)
      );
  END IF;
END $$;

-- ============================================================
-- PARTE 9: RLS Policies para tabelas de negócio
-- ============================================================
DO $$ BEGIN
  -- clientes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_clientes_all' AND tablename = 'clientes') THEN
    CREATE POLICY "company_clientes_all" ON public.clientes
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
  -- fornecedores
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_fornecedores_all' AND tablename = 'fornecedores') THEN
    CREATE POLICY "company_fornecedores_all" ON public.fornecedores
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
  -- orcamentos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_orcamentos_all' AND tablename = 'orcamentos') THEN
    CREATE POLICY "company_orcamentos_all" ON public.orcamentos
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
  -- pedidos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_pedidos_all' AND tablename = 'pedidos') THEN
    CREATE POLICY "company_pedidos_all" ON public.pedidos
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
  -- contas_receber
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_contas_receber_all' AND tablename = 'contas_receber') THEN
    CREATE POLICY "company_contas_receber_all" ON public.contas_receber
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
  -- contas_pagar
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_contas_pagar_all' AND tablename = 'contas_pagar') THEN
    CREATE POLICY "company_contas_pagar_all" ON public.contas_pagar
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
  -- inventory_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_inventory_all' AND tablename = 'inventory_items') THEN
    CREATE POLICY "company_inventory_all" ON public.inventory_items
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
  -- cutting_plans
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_cutting_plans_all' AND tablename = 'cutting_plans') THEN
    CREATE POLICY "company_cutting_plans_all" ON public.cutting_plans
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
  -- ai_import_jobs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_ai_import_all' AND tablename = 'ai_import_jobs') THEN
    CREATE POLICY "company_ai_import_all" ON public.ai_import_jobs
      USING (company_id = get_user_company_id())
      WITH CHECK (company_id = get_user_company_id());
  END IF;
END $$;

-- ============================================================
-- PARTE 10: Trigger handle_new_user — CORRIGIDO
-- Funciona com o schema real (profiles.id = auth.uid())
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
  v_nome TEXT;
BEGIN
  v_nome := COALESCE(
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Criar empresa automaticamente
  v_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Empresa de ' || v_nome
  );

  INSERT INTO public.companies (nome, email)
  VALUES (v_company_name, NEW.email)
  RETURNING id INTO v_company_id;

  -- Criar ou atualizar profile
  INSERT INTO public.profiles (id, user_id, nome, full_name, email, company_id)
  VALUES (
    NEW.id,
    NEW.id,
    v_nome,
    v_nome,
    NEW.email,
    v_company_id
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = COALESCE(profiles.user_id, NEW.id),
    nome = COALESCE(profiles.nome, EXCLUDED.nome),
    company_id = COALESCE(profiles.company_id, EXCLUDED.company_id);

  -- Criar role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PARTE 11: auto_provision_company() para login de users existentes
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_provision_company()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_nome text;
  v_email text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT company_id, COALESCE(nome, full_name), email
  INTO v_company_id, v_nome, v_email
  FROM profiles WHERE id = v_user_id;

  IF v_company_id IS NOT NULL THEN RETURN v_company_id; END IF;

  INSERT INTO companies (nome, email)
  VALUES (COALESCE(v_nome, 'Minha Empresa'), v_email)
  RETURNING id INTO v_company_id;

  UPDATE profiles SET company_id = v_company_id, user_id = v_user_id
  WHERE id = v_user_id;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION auto_provision_company() TO authenticated;

-- ============================================================
-- PARTE 12: Atualizar profile existente do Gustavo
-- (adicionar user_id e company_id se ainda não tem)
-- ============================================================
DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
BEGIN
  -- Buscar qualquer profile existente sem company_id
  FOR v_user_id IN
    SELECT id FROM public.profiles WHERE company_id IS NULL
  LOOP
    -- Criar empresa para este usuário
    INSERT INTO public.companies (nome, email)
    VALUES (
      'Empresa de ' || COALESCE(
        (SELECT COALESCE(nome, full_name) FROM profiles WHERE id = v_user_id),
        'Usuário'
      ),
      (SELECT email FROM profiles WHERE id = v_user_id)
    )
    RETURNING id INTO v_company_id;

    -- Vincular profile à empresa
    UPDATE public.profiles
    SET company_id = v_company_id,
        user_id = COALESCE(user_id, id),
        nome = COALESCE(nome, full_name, 'Usuário')
    WHERE id = v_user_id;

    -- Criar role admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================
-- PARTE 13: Limpar users órfãos do auth que falharam no signup
-- ============================================================
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
  AND created_at > now() - interval '7 days';

-- ============================================================
-- PRONTO! Agora:
-- 1. Desabilite "Confirm email" em Authentication > Providers > Email
-- 2. Tente cadastrar novamente pelo app
--
-- Verificar tabelas criadas:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- ============================================================
