-- Limpar todas as policies antigas de perfis_catalogo e recriar corretamente
-- Problema: policies antigas bloqueavam TODOS os dados mesmo após correção RLS

-- Remover TODAS as policies existentes
DROP POLICY IF EXISTS "Auth view perfis_catalogo" ON public.perfis_catalogo;
DROP POLICY IF EXISTS "Auth manage perfis_catalogo" ON public.perfis_catalogo;
DROP POLICY IF EXISTS "Users can view company perfis_catalogo" ON public.perfis_catalogo;
DROP POLICY IF EXISTS "Users can manage company perfis_catalogo" ON public.perfis_catalogo;
DROP POLICY IF EXISTS "Users can view perfis_catalogo" ON public.perfis_catalogo;
DROP POLICY IF EXISTS "Users can manage perfis_catalogo" ON public.perfis_catalogo;

-- Recriar RLS com estrutura correta (global + company-specific)
-- SELECT: permite dados globais (NULL) E dados da empresa
CREATE POLICY "see_global_and_company_perfis" ON public.perfis_catalogo
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL  -- dados globais do sistema
    OR company_id = get_user_company_id()  -- dados da empresa
  );

-- ALL: apenas gerenciar dados da própria empresa
CREATE POLICY "company_manage_perfis" ON public.perfis_catalogo
  FOR ALL USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());
