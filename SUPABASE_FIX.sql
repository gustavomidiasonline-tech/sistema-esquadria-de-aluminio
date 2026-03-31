-- Garante função get_user_company_id() correta
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;

-- Drop + Recria policies
DROP POLICY IF EXISTS "company_inventory_select" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_insert" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_update" ON public.inventory_items;
DROP POLICY IF EXISTS "company_inventory_delete" ON public.inventory_items;

CREATE POLICY "company_inventory_select" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "company_inventory_insert" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_inventory_update" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_inventory_delete" ON public.inventory_items
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
