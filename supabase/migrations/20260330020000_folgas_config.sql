-- ============================================================
-- Migration: Folgas Configuration Table
-- Date: 2026-03-30
-- Purpose: Allow per-manufacturer-line folga (clearance) customization
-- ============================================================

-- 1. Create folgas_config table
CREATE TABLE IF NOT EXISTS public.folgas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  linha_key TEXT NOT NULL,           -- "fabricante:linha" e.g. "alcoa:supreme"
  tipo TEXT NOT NULL                 -- "correr_2f", "correr_4f", "fixo", etc.
    CHECK (tipo IN ('correr_2f', 'correr_4f', 'fixo', 'basculante', 'maximar', 'porta', 'generico')),
  folga_trilho NUMERIC(6,2) NOT NULL DEFAULT 3,
  folga_marco NUMERIC(6,2) NOT NULL DEFAULT 10,
  folga_vidro_largura NUMERIC(6,2) NOT NULL DEFAULT 70,
  folga_vidro_altura NUMERIC(6,2) NOT NULL DEFAULT 90,
  folga_sobreposicao NUMERIC(6,2) NOT NULL DEFAULT 30,
  kerf NUMERIC(6,2) NOT NULL DEFAULT 3,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, linha_key, tipo)
);

CREATE INDEX IF NOT EXISTS idx_folgas_config_company ON public.folgas_config(company_id);
CREATE INDEX IF NOT EXISTS idx_folgas_config_linha ON public.folgas_config(linha_key);

ALTER TABLE public.folgas_config ENABLE ROW LEVEL SECURITY;

-- 2. RLS policies
CREATE POLICY "company_folgas_select" ON public.folgas_config
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "company_folgas_insert" ON public.folgas_config
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_folgas_update" ON public.folgas_config
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "company_folgas_delete" ON public.folgas_config
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- 3. Updated_at trigger
CREATE TRIGGER update_folgas_config_updated_at
  BEFORE UPDATE ON public.folgas_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Validation constraints
ALTER TABLE public.folgas_config
  ADD CONSTRAINT chk_folga_trilho CHECK (folga_trilho >= 0 AND folga_trilho <= 50),
  ADD CONSTRAINT chk_folga_marco CHECK (folga_marco >= 0 AND folga_marco <= 50),
  ADD CONSTRAINT chk_folga_vidro_l CHECK (folga_vidro_largura >= 0 AND folga_vidro_largura <= 200),
  ADD CONSTRAINT chk_folga_vidro_a CHECK (folga_vidro_altura >= 0 AND folga_vidro_altura <= 200),
  ADD CONSTRAINT chk_folga_sobreposicao CHECK (folga_sobreposicao >= 0 AND folga_sobreposicao <= 100),
  ADD CONSTRAINT chk_kerf CHECK (kerf >= 0 AND kerf <= 10);
