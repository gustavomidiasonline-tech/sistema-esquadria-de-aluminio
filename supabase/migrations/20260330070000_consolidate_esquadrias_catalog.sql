-- Consolidate esquadrias structure: Fix cut_rules to reference perfis_catalogo instead of catalog_profiles
-- This migration ensures ConfiguracaoModelos (mt_products + cut_rules) works with the imported inventory

BEGIN;

-- 1. Add perfil_id column to cut_rules if it doesn't exist
ALTER TABLE public.cut_rules
ADD COLUMN IF NOT EXISTS perfil_id uuid REFERENCES public.perfis_catalogo(id);

-- 2. For any existing cut_rules, try to match profile_id to perfil_id via codigo/code
UPDATE public.cut_rules cr
SET perfil_id = pc.id
FROM public.perfis_catalogo pc
WHERE cr.profile_id::text ILIKE '%' || pc.codigo || '%'
  AND cr.perfil_id IS NULL;

-- 3. Create view to sync perfis_catalogo with legacy cut_rules structure
CREATE OR REPLACE VIEW v_catalog_profiles AS
SELECT
  id,
  codigo as code,
  nome as description
FROM public.perfis_catalogo;

-- 4. Ensure RLS on cut_rules allows access to perfis_catalogo
ALTER TABLE public.cut_rules ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view company cut_rules" ON public.cut_rules;
DROP POLICY IF EXISTS "Users can manage company cut_rules" ON public.cut_rules;

-- Create new policies that work with multi-tenant setup
CREATE POLICY "Users can view company cut_rules" ON public.cut_rules
FOR SELECT TO authenticated
USING (
  product_id IN (
    SELECT id FROM public.mt_products
    WHERE company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can manage company cut_rules" ON public.cut_rules
FOR ALL TO authenticated
USING (
  product_id IN (
    SELECT id FROM public.mt_products
    WHERE company_id = get_user_company_id()
  )
)
WITH CHECK (
  product_id IN (
    SELECT id FROM public.mt_products
    WHERE company_id = get_user_company_id()
  )
);

COMMIT;
