-- ============================================================
-- Criação da tabela catalog_imports para auditoria
-- Rastreia cada importação de catálogo com histórico completo
-- Execute no SQL Editor do projeto
-- ============================================================

-- Criar tabela de auditoria de imports
CREATE TABLE IF NOT EXISTS public.catalog_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadados do import
  file_name TEXT,
  file_size_bytes INTEGER,
  fabricante TEXT,

  -- Resultados
  perfis_importados INTEGER DEFAULT 0,
  modelos_importados INTEGER DEFAULT 0,
  perfis_sincronizados INTEGER DEFAULT 0,
  erros_count INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'pendente', -- pendente, sucesso, falha, parcial
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Rastreabilidade
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_catalog_imports_company_id ON public.catalog_imports(company_id);
CREATE INDEX IF NOT EXISTS idx_catalog_imports_user_id ON public.catalog_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_imports_created_at ON public.catalog_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_imports_status ON public.catalog_imports(status);

-- RLS Policy: Usuários só veem imports da sua própria empresa
ALTER TABLE public.catalog_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem imports da sua empresa" ON public.catalog_imports;
CREATE POLICY "Usuários veem imports da sua empresa" ON public.catalog_imports
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem inserir imports" ON public.catalog_imports;
CREATE POLICY "Usuários podem inserir imports" ON public.catalog_imports
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Função para registrar import (chamada após sucesso)
CREATE OR REPLACE FUNCTION public.log_catalog_import(
  p_company_id UUID,
  p_user_id UUID,
  p_file_name TEXT,
  p_fabricante TEXT,
  p_perfis_importados INTEGER DEFAULT 0,
  p_modelos_importados INTEGER DEFAULT 0,
  p_perfis_sincronizados INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'sucesso',
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_import_id UUID;
BEGIN
  INSERT INTO public.catalog_imports (
    company_id,
    user_id,
    file_name,
    fabricante,
    perfis_importados,
    modelos_importados,
    perfis_sincronizados,
    status,
    error_message,
    completed_at,
    duration_ms
  ) VALUES (
    p_company_id,
    p_user_id,
    p_file_name,
    p_fabricante,
    p_perfis_importados,
    p_modelos_importados,
    p_perfis_sincronizados,
    p_status,
    p_error_message,
    now(),
    p_duration_ms
  ) RETURNING id INTO v_import_id;

  RETURN v_import_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION log_catalog_import TO authenticated;

-- View para auditoria: Últimos 100 imports por empresa
CREATE OR REPLACE VIEW public.v_catalog_imports_recent AS
SELECT
  ci.id,
  ci.company_id,
  c.name as company_name,
  ci.user_id,
  p.nome as user_name,
  ci.file_name,
  ci.fabricante,
  ci.perfis_importados,
  ci.modelos_importados,
  ci.perfis_sincronizados,
  ci.status,
  ci.error_message,
  ci.created_at,
  ci.completed_at,
  ci.duration_ms,
  CASE WHEN ci.status = 'sucesso' THEN (ci.perfis_importados + ci.modelos_importados)
       ELSE 0 END as total_items
FROM public.catalog_imports ci
LEFT JOIN public.companies c ON ci.company_id = c.id
LEFT JOIN public.profiles p ON ci.user_id = p.id
ORDER BY ci.created_at DESC
LIMIT 100;

-- Comentários para documentação
COMMENT ON TABLE public.catalog_imports IS 'Auditoria de importações de catálogo de fabricantes';
COMMENT ON COLUMN public.catalog_imports.status IS 'Estado do import: pendente, sucesso, falha, parcial';
COMMENT ON COLUMN public.catalog_imports.duration_ms IS 'Tempo total de processamento em milissegundos';
COMMENT ON FUNCTION public.log_catalog_import IS 'Função para registrar import de catálogo após conclusão';
COMMENT ON VIEW public.v_catalog_imports_recent IS 'Últimos 100 imports para auditoria e debugging';
