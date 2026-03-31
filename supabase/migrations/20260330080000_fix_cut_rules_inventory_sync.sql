-- Fix: Sincronizar cut_rules com inventory_items (não com catalog_profiles vazio)
-- Objetivo: Permitir que cut_rules referencie os itens reais do inventário

BEGIN;

-- 1. Adicionar coluna inventory_item_id (referência correta)
ALTER TABLE public.cut_rules
ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES public.inventory_items(id);

-- 2. Atualizar foreign key constraint para permitir NULL em profile_id (transição)
ALTER TABLE public.cut_rules
DROP CONSTRAINT IF EXISTS cut_rules_profile_id_fkey;

ALTER TABLE public.cut_rules
ADD CONSTRAINT cut_rules_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.catalog_profiles(id) ON DELETE SET NULL;

-- 3. Tentar sincronizar dados existentes: inventário_item_id com base no perfil
-- Se tiver dados em cut_rules, tenta preencher a coluna nova
UPDATE public.cut_rules cr
SET inventory_item_id = ii.id
FROM public.inventory_items ii
WHERE cr.profile_id::text ILIKE '%' || ii.codigo || '%'
  AND ii.tipo = 'perfil'
  AND cr.inventory_item_id IS NULL;

-- 4. Para o futuro: quando criar nova rule, usar inventory_item_id
-- O frontend vai precisar atualizar para usar inventory_item_id ao invés de profile_id

-- 5. Garantir que qualquer uma das colunas (profile_id ou inventory_item_id) possa ser usada
-- VIEW v_cut_rules_full para compatibilidade
CREATE OR REPLACE VIEW v_cut_rules_full AS
SELECT
  cr.id,
  cr.product_id,
  cr.profile_id,
  cr.inventory_item_id,
  COALESCE(ii.id, cr.profile_id) as effective_profile_id,
  COALESCE(ii.codigo, '') as profile_code,
  COALESCE(ii.nome, '') as profile_description,
  cr.formula,
  cr.quantity,
  cr.angle,
  cr.axis,
  cr.created_at
FROM public.cut_rules cr
LEFT JOIN public.inventory_items ii ON cr.inventory_item_id = ii.id;

COMMIT;
