-- ============================================================
-- Fix: inventory_items RLS Policies
-- Issue: get_user_company_id() wasn't using correct column (user_id)
-- Solution: Use get_user_company_id() function (fixed in migration 20260330010000)
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "company_inventory_select" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_insert" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_update" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_delete" ON public.inventory_items;

-- Recreate using get_user_company_id() - will be fixed in later migration
CREATE POLICY "company_inventory_select" ON public.inventory_items
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_inventory_insert" ON public.inventory_items
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_inventory_update" ON public.inventory_items
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_inventory_delete" ON public.inventory_items
  FOR DELETE USING (company_id = get_user_company_id());
