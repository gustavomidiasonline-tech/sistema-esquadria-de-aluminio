-- ============================================================
-- Fix: Complete inventory RLS - ensure function exists first
-- Issue: 406 error may be from missing get_user_company_id()
-- Solution: Create function, then use it in all inventory policies
-- ============================================================

-- 1. Ensure get_user_company_id() function exists with correct logic
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;

-- 2. Drop all old inventory policies (cleanup from previous migrations)
DROP POLICY IF EXISTS "company_inventory_select" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_insert" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_update" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_delete" ON public.inventory_items;

-- 3. Recreate with consistent use of get_user_company_id()
CREATE POLICY "company_inventory_select" ON public.inventory_items
  FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "company_inventory_insert" ON public.inventory_items
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_inventory_update" ON public.inventory_items
  FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_inventory_delete" ON public.inventory_items
  FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id());

-- 4. Ensure table RLS is enabled
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
