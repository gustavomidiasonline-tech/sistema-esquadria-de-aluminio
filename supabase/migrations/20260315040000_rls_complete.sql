-- ============================================================
-- Migration: RLS Complete — Isolamento multitenancy completo
-- Story: 3.4 — Completar RLS para todas as tabelas de negócio
-- Data: 2026-03-15
-- ============================================================

-- ============================================================
-- fornecedores — isolamento por empresa
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can manage fornecedores" ON public.fornecedores;

CREATE POLICY "company_fornecedores_select" ON public.fornecedores
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_fornecedores_insert" ON public.fornecedores
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_fornecedores_update" ON public.fornecedores
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_fornecedores_delete" ON public.fornecedores
  FOR DELETE USING (
    company_id = get_user_company_id()
    AND has_role(auth.uid(), 'admin'::user_role)
  );

-- ============================================================
-- produtos — isolamento por empresa
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can manage produtos" ON public.produtos;

CREATE POLICY "company_produtos_select" ON public.produtos
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_produtos_insert" ON public.produtos
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_produtos_update" ON public.produtos
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_produtos_delete" ON public.produtos
  FOR DELETE USING (
    company_id = get_user_company_id()
    AND has_role(auth.uid(), 'admin'::user_role)
  );

-- ============================================================
-- servicos — isolamento por empresa
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated users can manage servicos" ON public.servicos;

CREATE POLICY "company_servicos_select" ON public.servicos
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_servicos_insert" ON public.servicos
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_servicos_update" ON public.servicos
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_servicos_delete" ON public.servicos
  FOR DELETE USING (
    company_id = get_user_company_id()
    AND has_role(auth.uid(), 'admin'::user_role)
  );

-- ============================================================
-- planos_de_corte — isolamento por empresa
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view planos_de_corte" ON public.planos_de_corte;
DROP POLICY IF EXISTS "Authenticated users can manage planos_de_corte" ON public.planos_de_corte;

CREATE POLICY "company_planos_select" ON public.planos_de_corte
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_planos_insert" ON public.planos_de_corte
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_planos_update" ON public.planos_de_corte
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_planos_delete" ON public.planos_de_corte
  FOR DELETE USING (
    company_id = get_user_company_id()
    AND has_role(auth.uid(), 'admin'::user_role)
  );

-- ============================================================
-- agenda_eventos — isolamento por empresa
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view agenda_eventos" ON public.agenda_eventos;
DROP POLICY IF EXISTS "Authenticated users can manage agenda_eventos" ON public.agenda_eventos;

CREATE POLICY "company_agenda_select" ON public.agenda_eventos
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_agenda_insert" ON public.agenda_eventos
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_agenda_update" ON public.agenda_eventos
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_agenda_delete" ON public.agenda_eventos
  FOR DELETE USING (
    company_id = get_user_company_id()
    AND has_role(auth.uid(), 'admin'::user_role)
  );
