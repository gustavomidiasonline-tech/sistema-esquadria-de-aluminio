-- Fixar RLS policy para usar auth.uid() diretamente em vez de get_user_company_id()
-- Problema: função não funcionava dentro da RLS policy (retornava NULL)
-- Solução: fazer o JOIN direto com profiles

-- Limpar policies antigas
DROP POLICY IF EXISTS "see_global_and_company_perfis" ON public.perfis_catalogo;
DROP POLICY IF EXISTS "company_manage_perfis" ON public.perfis_catalogo;

-- Recriar com auth.uid() direto
-- SELECT: global (NULL) + company-specific (join com profiles)
CREATE POLICY "see_global_and_company_perfis" ON public.perfis_catalogo
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL  -- global/system data
    OR company_id = (
      SELECT company_id FROM public.profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- ALL: apenas dados da própria empresa
CREATE POLICY "company_manage_perfis" ON public.perfis_catalogo
  FOR ALL USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );
