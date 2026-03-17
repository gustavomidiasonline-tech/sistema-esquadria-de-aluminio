-- ============================================================
-- Migration: Multitenancy SaaS — Tabela companies
-- Story: 3.1 — Tabela companies (Multitenancy SaaS)
-- Data: 2026-03-15
-- ============================================================

-- 1. Tabela de empresas (tenant)
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

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Adicionar company_id em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- 3. Função helper: retorna company_id do usuário autenticado
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

-- 4. Adicionar company_id nas tabelas de negócio principais
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

ALTER TABLE public.servicos
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

ALTER TABLE public.planos_de_corte
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

ALTER TABLE public.agenda_eventos
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 5. Índices para performance de consultas por empresa
CREATE INDEX IF NOT EXISTS idx_clientes_company_id ON public.clientes(company_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_company_id ON public.fornecedores(company_id);
CREATE INDEX IF NOT EXISTS idx_produtos_company_id ON public.produtos(company_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_company_id ON public.orcamentos(company_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_company_id ON public.pedidos(company_id);
CREATE INDEX IF NOT EXISTS idx_servicos_company_id ON public.servicos(company_id);

-- 6. RLS Policies — companies (usuário pode ver sua empresa)
CREATE POLICY "users_see_own_company" ON public.companies
  FOR SELECT USING (
    id = get_user_company_id()
  );

CREATE POLICY "admins_manage_company" ON public.companies
  FOR ALL USING (
    id = get_user_company_id()
  );

-- 7. RLS — clientes (isolamento por empresa)
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can manage clientes" ON public.clientes;

CREATE POLICY "company_clientes_select" ON public.clientes
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_clientes_insert" ON public.clientes
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_clientes_update" ON public.clientes
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_clientes_delete" ON public.clientes
  FOR DELETE USING (
    company_id = get_user_company_id()
    
  );

-- 8. RLS — orcamentos
DROP POLICY IF EXISTS "Authenticated users can view orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Authenticated users can manage orcamentos" ON public.orcamentos;

CREATE POLICY "company_orcamentos_select" ON public.orcamentos
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_orcamentos_insert" ON public.orcamentos
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_orcamentos_update" ON public.orcamentos
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_orcamentos_delete" ON public.orcamentos
  FOR DELETE USING (
    company_id = get_user_company_id()
    
  );

-- 9. RLS — pedidos
DROP POLICY IF EXISTS "Authenticated users can view pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Authenticated users can manage pedidos" ON public.pedidos;

CREATE POLICY "company_pedidos_select" ON public.pedidos
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_pedidos_insert" ON public.pedidos
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_pedidos_update" ON public.pedidos
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_pedidos_delete" ON public.pedidos
  FOR DELETE USING (
    company_id = get_user_company_id()
    
  );

-- 10. Atualizar trigger de novo usuário para criar/vincular empresa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  -- Verificar se há company_id nos metadados
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  -- Se não tem company_id, criar nova empresa
  IF v_company_id IS NULL THEN
    v_company_name := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      'Empresa de ' || COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)
    );

    INSERT INTO public.companies (nome, email)
    VALUES (v_company_name, NEW.email)
    RETURNING id INTO v_company_id;
  END IF;

  -- Criar profile vinculado à empresa
  INSERT INTO public.profiles (id, nome, email, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    v_company_id
  )
  ON CONFLICT (id) DO UPDATE
    SET company_id = v_company_id;

  -- Atribuir role de admin para o primeiro usuário da empresa
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
