-- ============================================================
-- Seed: JC2F_L25 (Janela de correr 2 folhas + 2 fixos laterais)
-- Linha 25 / Fabricante: Alusystem
-- ============================================================

-- Company default for dev data
WITH company AS (
  SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid AS id
)
-- Fabricante
INSERT INTO public.fabricantes (nome, company_id)
SELECT 'Alusystem', company.id
FROM company
WHERE NOT EXISTS (
  SELECT 1 FROM public.fabricantes f
  WHERE f.nome = 'Alusystem' AND f.company_id = company.id
);

-- Linha 25
WITH company AS (
  SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid AS id
),
fabricante AS (
  SELECT id FROM public.fabricantes
  WHERE nome = 'Alusystem' AND company_id = company.id
  LIMIT 1
)
INSERT INTO public.linhas (nome, categoria, fabricante_id, company_id)
SELECT 'Linha 25', 'aluminio', fabricante.id, company.id
FROM company, fabricante
WHERE NOT EXISTS (
  SELECT 1 FROM public.linhas l
  WHERE l.nome = 'Linha 25' AND l.company_id = company.id
);

-- Perfis catalogo (Linha 25)
WITH company AS (
  SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid AS id
),
linha AS (
  SELECT id FROM public.linhas
  WHERE nome = 'Linha 25' AND company_id = company.id
  LIMIT 1
),
dados AS (
  SELECT * FROM (VALUES
    ('PERFIL_TRILHO_SUP_L25', 'Trilho superior 2 vias', 'trilho', 0.82, 6000),
    ('PERFIL_TRILHO_INF_L25', 'Trilho inferior 2 vias', 'trilho', 0.95, 6000),
    ('PERFIL_MONTANTE_LATERAL_L25', 'Montante lateral', 'montante', 0.55, 6000),
    ('PERFIL_TRAV_SUP_FOLHA_L25', 'Travessa superior da folha', 'travessa', 0.48, 6000),
    ('PERFIL_TRAV_INF_FOLHA_L25', 'Travessa inferior da folha', 'travessa', 0.52, 6000),
    ('PERFIL_MONTANTE_FOLHA_L25', 'Montante lateral da folha', 'montante', 0.46, 6000)
  ) AS t(codigo, nome, tipo, peso_kg_m, comprimento_padrao_mm)
)
INSERT INTO public.perfis_catalogo (
  codigo,
  nome,
  linha_id,
  tipo,
  peso_kg_m,
  comprimento_padrao_mm,
  company_id
)
SELECT
  d.codigo,
  d.nome,
  linha.id,
  d.tipo,
  d.peso_kg_m,
  d.comprimento_padrao_mm,
  company.id
FROM dados d
CROSS JOIN linha
CROSS JOIN company
WHERE NOT EXISTS (
  SELECT 1 FROM public.perfis_catalogo pc
  WHERE pc.codigo = d.codigo AND pc.company_id = company.id
);

-- Modelo de esquadria (JC2F_L25)
WITH company AS (
  SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid AS id
),
linha AS (
  SELECT id FROM public.linhas
  WHERE nome = 'Linha 25' AND company_id = company.id
  LIMIT 1
)
INSERT INTO public.modelos_esquadria (
  nome,
  tipo,
  categoria,
  linha_id,
  folhas,
  company_id
)
SELECT
  'JC2F_L25 - Janela de correr 2 folhas + 2 fixos laterais',
  'correr',
  'janela',
  linha.id,
  2,
  company.id
FROM company, linha
WHERE NOT EXISTS (
  SELECT 1 FROM public.modelos_esquadria m
  WHERE m.nome = 'JC2F_L25 - Janela de correr 2 folhas + 2 fixos laterais'
    AND m.company_id = company.id
);

-- Componentes do modelo (perfis + formulas)
WITH company AS (
  SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid AS id
),
modelo AS (
  SELECT id FROM public.modelos_esquadria
  WHERE nome = 'JC2F_L25 - Janela de correr 2 folhas + 2 fixos laterais'
    AND company_id = company.id
  LIMIT 1
),
perfis AS (
  SELECT id, codigo FROM public.perfis_catalogo
  WHERE company_id = company.id
    AND codigo IN (
      'PERFIL_TRILHO_SUP_L25',
      'PERFIL_TRILHO_INF_L25',
      'PERFIL_MONTANTE_LATERAL_L25',
      'PERFIL_TRAV_SUP_FOLHA_L25',
      'PERFIL_TRAV_INF_FOLHA_L25',
      'PERFIL_MONTANTE_FOLHA_L25'
    )
),
dados AS (
  SELECT * FROM (VALUES
    ('PERFIL_TRILHO_SUP_L25', 'trilho_superior', 'largura_total', 1),
    ('PERFIL_TRILHO_INF_L25', 'trilho_inferior', 'largura_total', 1),
    ('PERFIL_MONTANTE_LATERAL_L25', 'montante_lateral', 'altura_total', 2),
    ('PERFIL_TRAV_SUP_FOLHA_L25', 'folha_travessa_superior', '(largura_total / 2) - 40', 2),
    ('PERFIL_TRAV_INF_FOLHA_L25', 'folha_travessa_inferior', '(largura_total / 2) - 40', 2),
    ('PERFIL_MONTANTE_FOLHA_L25', 'folha_montante', 'altura_total - 60', 4)
  ) AS t(codigo, posicao, formula_calculo, quantidade)
)
INSERT INTO public.componentes_modelo (
  esquadria_id,
  perfil_id,
  quantidade,
  formula_calculo,
  posicao,
  company_id
)
SELECT
  modelo.id,
  perfis.id,
  d.quantidade,
  d.formula_calculo,
  d.posicao,
  company.id
FROM dados d
JOIN perfis ON perfis.codigo = d.codigo
CROSS JOIN modelo
CROSS JOIN company
WHERE NOT EXISTS (
  SELECT 1 FROM public.componentes_modelo cm
  WHERE cm.esquadria_id = modelo.id
    AND cm.perfil_id = perfis.id
    AND cm.posicao = d.posicao
);

-- Ferragens / componentes (catalogo)
WITH company AS (
  SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid AS id
),
dados AS (
  SELECT * FROM (VALUES
    ('Rodizio duplo regulavel', 'Alusystem', 'rodizio', 'janela_correr_l25'),
    ('Fecho concha embutido', 'Alusystem', 'fecho', 'janela_correr_l25'),
    ('Escova vedacao 5mm', 'Alusystem', 'vedacao', 'janela_correr_l25'),
    ('Batente final trilho', 'Alusystem', 'batente', 'janela_correr_l25'),
    ('Parafuso inox 3.8x16', 'Alusystem', 'fixacao', 'janela_correr_l25')
  ) AS t(nome, fabricante, tipo, aplicacao)
)
INSERT INTO public.ferragens (nome, fabricante, tipo, aplicacao, company_id)
SELECT d.nome, d.fabricante, d.tipo, d.aplicacao, company.id
FROM dados d
CROSS JOIN company
WHERE NOT EXISTS (
  SELECT 1 FROM public.ferragens f
  WHERE f.nome = d.nome AND f.company_id = company.id
);
