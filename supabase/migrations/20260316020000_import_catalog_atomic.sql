-- supabase-no-transaction
-- Função atômica para importação de catálogo
-- Executa DELETE + INSERT dentro de uma única transação SQL.
-- Elimina a janela de inconsistência do padrão delete+insert do cliente.

CREATE OR REPLACE FUNCTION import_catalog_atomic(
  p_company_id  uuid,
  p_perfis      jsonb,
  p_modelos     jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perfis_count   int := 0;
  v_modelos_count  int := 0;
  v_codigos_perfis text[];
  v_codigos_modelos text[];
BEGIN
  -- ── Validações básicas ──────────────────────────────────────────────────
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id é obrigatório';
  END IF;

  -- ── Perfis ──────────────────────────────────────────────────────────────
  IF p_perfis IS NOT NULL AND jsonb_array_length(p_perfis) > 0 THEN
    -- Coletar códigos para delete seletivo
    SELECT array_agg(elem->>'codigo')
      INTO v_codigos_perfis
      FROM jsonb_array_elements(p_perfis) AS elem;

    -- Deletar apenas os códigos que serão re-importados
    DELETE FROM perfis_catalogo
      WHERE company_id = p_company_id
        AND codigo = ANY(v_codigos_perfis);

    -- Inserir novos perfis
    INSERT INTO perfis_catalogo (company_id, codigo, nome, tipo, peso_kg_m, espessura_mm)
    SELECT
      p_company_id,
      (elem->>'codigo')::text,
      (elem->>'nome')::text,
      COALESCE((elem->>'tipo')::text, 'perfil'),
      CASE WHEN elem->>'peso_kg_m' IS NULL THEN NULL
           ELSE (elem->>'peso_kg_m')::numeric END,
      CASE WHEN elem->>'espessura_mm' IS NULL THEN NULL
           ELSE (elem->>'espessura_mm')::numeric END
    FROM jsonb_array_elements(p_perfis) AS elem;

    GET DIAGNOSTICS v_perfis_count = ROW_COUNT;
  END IF;

  -- ── Modelos ─────────────────────────────────────────────────────────────
  IF p_modelos IS NOT NULL AND jsonb_array_length(p_modelos) > 0 THEN
    SELECT array_agg(elem->>'codigo')
      INTO v_codigos_modelos
      FROM jsonb_array_elements(p_modelos) AS elem;

    DELETE FROM window_models
      WHERE company_id = p_company_id
        AND codigo = ANY(v_codigos_modelos);

    INSERT INTO window_models (company_id, codigo, nome, tipo, descricao, ativo)
    SELECT
      p_company_id,
      (elem->>'codigo')::text,
      (elem->>'nome')::text,
      COALESCE((elem->>'tipo')::text, 'janela'),
      (elem->>'descricao')::text,
      true
    FROM jsonb_array_elements(p_modelos) AS elem;

    GET DIAGNOSTICS v_modelos_count = ROW_COUNT;
  END IF;

  -- ── Retorno ─────────────────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'perfis_salvos',  v_perfis_count,
    'modelos_salvos', v_modelos_count
  );

EXCEPTION WHEN OTHERS THEN
  -- Qualquer erro faz rollback automático da transação inteira
  RAISE EXCEPTION 'Falha na importação atômica: %', SQLERRM;
END;
$$;
