-- ============================================================
-- Migration: Fix inventory_items company_id NULL constraint
-- Date: 2026-03-30
-- Issue: inventory_items had company_id = NULL from import
-- ============================================================

-- 1. Get or create a default company (this should already exist)
-- Use the first company in the database
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    -- Fill all NULL company_id with the first company
    UPDATE public.inventory_items
    SET company_id = v_company_id
    WHERE company_id IS NULL;
  END IF;
END $$;

-- 2. Verify all have company_id now
-- If any still NULL, set them to first company as fallback
UPDATE public.inventory_items
SET company_id = (
  SELECT id FROM public.companies
  ORDER BY created_at ASC LIMIT 1
)
WHERE company_id IS NULL;
