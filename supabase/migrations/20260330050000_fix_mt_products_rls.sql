-- ============================================================
-- Fix: mt_products and cut_rules RLS - allow all company members
-- Issue: Only admins could insert/update/delete, blocking normal users
-- Solution: Add policies for all authenticated company members
-- ============================================================

-- Drop admin-only management policies
DROP POLICY IF EXISTS "Admins can manage company products" ON public.mt_products;
DROP POLICY IF EXISTS "Admins can manage company cut rules" ON public.cut_rules;

-- mt_products: allow all company members to manage
CREATE POLICY "company_mt_products_insert" ON public.mt_products
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "company_mt_products_update" ON public.mt_products
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "company_mt_products_delete" ON public.mt_products
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- cut_rules: allow all company members to manage
CREATE POLICY "company_cut_rules_insert" ON public.cut_rules
  FOR INSERT TO authenticated
  WITH CHECK (product_id IN (SELECT id FROM public.mt_products WHERE company_id = public.get_user_company_id()));

CREATE POLICY "company_cut_rules_update" ON public.cut_rules
  FOR UPDATE TO authenticated
  USING (product_id IN (SELECT id FROM public.mt_products WHERE company_id = public.get_user_company_id()));

CREATE POLICY "company_cut_rules_delete" ON public.cut_rules
  FOR DELETE TO authenticated
  USING (product_id IN (SELECT id FROM public.mt_products WHERE company_id = public.get_user_company_id()));
