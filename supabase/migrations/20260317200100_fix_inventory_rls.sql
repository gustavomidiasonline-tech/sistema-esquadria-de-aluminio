-- ============================================================
-- Fix: inventory_items RLS Policies
-- Issue: get_user_company_id() returns NULL in RLS context
-- Solution: Use direct auth.uid() with JOIN to profiles table
-- ============================================================

-- Drop old policies that use get_user_company_id()
DROP POLICY IF EXISTS "company_inventory_select" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_insert" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_update" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_delete" ON public.inventory_items;

-- Recreate with direct auth.uid() approach
CREATE POLICY "company_inventory_select" ON public.inventory_items
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "company_inventory_insert" ON public.inventory_items
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "company_inventory_update" ON public.inventory_items
  FOR UPDATE USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "company_inventory_delete" ON public.inventory_items
  FOR DELETE USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );
