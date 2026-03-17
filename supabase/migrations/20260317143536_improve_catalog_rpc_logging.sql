-- Melhorar logging da função import_catalog_atomic para debugar

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

  -- Debug: log dos parâmetros recebidos
  RAISE NOTICE '[IMPORT_CATALOG] company_id: %, perfis_count: %, modelos_count: %',
    p_company_id,
    CASE WHEN p_perfis IS NULL THEN 0 ELSE jsonb_array_length(p_perfis) END,
    CASE WHEN p_modelos IS NULL THEN 0 ELSE jsonb_array_length(p_modelos) END;

  -- ── Perfis ──────────────────────────────────────────────────────────────
  IF p_perfis IS NOT NULL AND jsonb_array_length(p_perfis) > 0 THEN
    -- Coletar códigos para delete seletivo
    SELECT array_agg(elem->>'codigo')
      INTO v_codigos_perfis
      FROM jsonb_array_elements(p_perfis) AS elem;

    RAISE NOTICE '[IMPORT_CATALOG] Deletando perfis antigos: %', v_codigos_perfis;

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
    RAISE NOTICE '[IMPORT_CATALOG] Salvos % perfis', v_perfis_count;
  END IF;

  -- ── Modelos ─────────────────────────────────────────────────────────────
  IF p_modelos IS NOT NULL AND jsonb_array_length(p_modelos) > 0 THEN
    SELECT array_agg(elem->>'codigo')
      INTO v_codigos_modelos
      FROM jsonb_array_elements(p_modelos) AS elem;

    RAISE NOTICE '[IMPORT_CATALOG] Deletando modelos antigos: %', v_codigos_modelos;

    DELETE FROM window_models
      WHERE company_id = p_company_id
        AND codigo = ANY(v_codigos_modelos);

    INSERT INTO window_models (company_id, codigo, nome, tipo, descricao, ativo)
    SELECT
      p_company_id,
      (elem->>'codigo')::text,
      (elem->>'nome')::text,
      COALESCE((elem->>'tipo')::text, 'fixo'),
      (elem->>'descricao')::text,
      true
    FROM jsonb_array_elements(p_modelos) AS elem;

    GET DIAGNOSTICS v_modelos_count = ROW_COUNT;
    RAISE NOTICE '[IMPORT_CATALOG] Salvos % modelos', v_modelos_count;
  END IF;

  -- ── Retorno ─────────────────────────────────────────────────────────────
  RAISE NOTICE '[IMPORT_CATALOG] Finalizando: perfis_salvos=%, modelos_salvos=%', v_perfis_count, v_modelos_count;

  RETURN jsonb_build_object(
    'perfis_salvos',  v_perfis_count,
    'modelos_salvos', v_modelos_count,
    'company_id_usado', p_company_id,
    'success', true
  );

EXCEPTION WHEN OTHERS THEN
  -- Qualquer erro faz rollback automático da transação inteira
  RAISE EXCEPTION '[IMPORT_CATALOG] Falha: %', SQLERRM;
END;
$$;
