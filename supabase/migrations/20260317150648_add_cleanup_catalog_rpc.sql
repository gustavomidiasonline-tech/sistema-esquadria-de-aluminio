-- RPC para limpar catálogo antigo da empresa
-- Útil para remover dados com qualidade ruim antes de reimportar

CREATE OR REPLACE FUNCTION cleanup_catalog(
  p_company_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perfis_deleted int := 0;
  v_modelos_deleted int := 0;
BEGIN
  -- Validação
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id é obrigatório';
  END IF;

  -- Deletar perfis da empresa
  DELETE FROM public.perfis_catalogo
  WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_perfis_deleted = ROW_COUNT;

  -- Deletar modelos da empresa
  DELETE FROM public.window_models
  WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_modelos_deleted = ROW_COUNT;

  RAISE NOTICE '[CLEANUP_CATALOG] Deletados % perfis e % modelos para company_id %',
    v_perfis_deleted, v_modelos_deleted, p_company_id;

  RETURN jsonb_build_object(
    'perfis_deletados', v_perfis_deleted,
    'modelos_deletados', v_modelos_deleted,
    'success', true
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '[CLEANUP_CATALOG] Falha: %', SQLERRM;
END;
$$;
