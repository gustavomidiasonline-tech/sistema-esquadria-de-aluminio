-- ============================================================
-- Migration: Fix orcamento_itens company_id RLS blocker
-- Date: 2026-03-30
-- Issue: orcamento_itens.company_id was NULL, blocking RLS INSERT
-- ============================================================

-- 1. Populate orcamento_itens.company_id from parent orcamentos
UPDATE public.orcamento_itens oi
SET company_id = o.company_id
FROM public.orcamentos o
WHERE oi.orcamento_id = o.id
  AND oi.company_id IS NULL;

-- 2. Populate orcamentos.company_id from created_by user (where possible)
-- If still NULL, use a default company (first company in DB as fallback)
UPDATE public.orcamentos o
SET company_id = COALESCE(
  (SELECT company_id FROM public.profiles WHERE id = o.created_by LIMIT 1),
  (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1)
)
WHERE o.company_id IS NULL;

-- 3. Do it again for orcamento_itens (in case some orcamentos were still NULL)
UPDATE public.orcamento_itens oi
SET company_id = o.company_id
FROM public.orcamentos o
WHERE oi.orcamento_id = o.id
  AND oi.company_id IS NULL;

-- 4. Set NOT NULL constraint on orcamentos
ALTER TABLE public.orcamentos
ALTER COLUMN company_id SET NOT NULL;

-- 5. Set NOT NULL constraint on orcamento_itens
ALTER TABLE public.orcamento_itens
ALTER COLUMN company_id SET NOT NULL;

-- 6. Create indexes for RLS filtering efficiency
CREATE INDEX IF NOT EXISTS idx_orcamentos_company_id ON public.orcamentos(company_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_company_id ON public.orcamento_itens(company_id);

-- 7. Re-check RLS policies are correct
-- (These should already exist from previous migrations)
-- Verify with:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'orcamento_itens';
