-- ============================================================
-- Fix: order_progress RLS - allow all company members
-- Issue: Users getting 403 Forbidden when trying to insert/update
-- Solution: Add policies allowing authenticated users to manage order progress
-- ============================================================

-- Drop any existing restrictive policies on order_progress
DROP POLICY IF EXISTS "Admins can manage order progress" ON public.order_progress;
DROP POLICY IF EXISTS "Users can view order progress" ON public.order_progress;
DROP POLICY IF EXISTS "Users can insert order progress" ON public.order_progress;
DROP POLICY IF EXISTS "order_progress_insert_authenticated" ON public.order_progress;
DROP POLICY IF EXISTS "order_progress_update_authenticated" ON public.order_progress;
DROP POLICY IF EXISTS "order_progress_select_authenticated" ON public.order_progress;
DROP POLICY IF EXISTS "order_progress_delete_authenticated" ON public.order_progress;

-- Ensure RLS is enabled
ALTER TABLE public.order_progress ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
-- Allow INSERT for any authenticated user
CREATE POLICY "order_progress_insert_authenticated" ON public.order_progress
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow UPDATE for any authenticated user (can edit any progress)
CREATE POLICY "order_progress_update_authenticated" ON public.order_progress
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow SELECT for authenticated users
CREATE POLICY "order_progress_select_authenticated" ON public.order_progress
  FOR SELECT TO authenticated
  USING (true);

-- Allow DELETE for authenticated users
CREATE POLICY "order_progress_delete_authenticated" ON public.order_progress
  FOR DELETE TO authenticated
  USING (true);
