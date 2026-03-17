-- Fix RLS policy for perfis_catalogo to allow global data (company_id IS NULL)
-- This matches the pattern used in window_models which correctly allows both:
-- - Global/system data (company_id = NULL)
-- - Company-specific data (company_id = current_user_company_id)

DROP POLICY IF EXISTS "Users can view company perfis_catalogo" ON public.perfis_catalogo;

CREATE POLICY "Users can view company perfis_catalogo" ON public.perfis_catalogo
  FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id = get_user_company_id());
