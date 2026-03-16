-- ============================================================
-- Seed: Modelos de Esquadrias Padrao (Global)
-- Nota: Seed data principal esta na migration 20260315020000.
-- Este arquivo contem seeds adicionais para ambiente de dev/staging.
-- ============================================================

-- Modelos adicionais de exemplo (somente para dev/staging)
-- Os 6 modelos base (JC2F, JC4F, JBL, JMX, JFX, JPT) ja estao na migration.

-- Glass types de exemplo (globais, sem company_id)
INSERT INTO public.glass_types (codigo, nome, espessura_mm, tipo, cor, preco_m2) VALUES
  ('VT4', 'Vidro Temperado 4mm', 4, 'temperado', 'incolor', 85.00),
  ('VT6', 'Vidro Temperado 6mm', 6, 'temperado', 'incolor', 120.00),
  ('VT8', 'Vidro Temperado 8mm', 8, 'temperado', 'incolor', 160.00),
  ('VL88', 'Vidro Laminado 8mm', 8, 'laminado', 'incolor', 200.00),
  ('VF4', 'Vidro Fume 4mm', 4, 'comum', 'fume', 95.00),
  ('VI20', 'Vidro Insulado 20mm', 20, 'insulado', 'incolor', 350.00)
ON CONFLICT DO NOTHING;

-- Hardware de exemplo (globais)
INSERT INTO public.hardware (codigo, nome, tipo, unidade, preco_unitario) VALUES
  ('FC01', 'Fechadura Cremonese', 'fechadura', 'un', 45.00),
  ('PX01', 'Puxador Concha Aluminio', 'puxador', 'un', 12.00),
  ('RL01', 'Roldana Simples 25mm', 'roldana', 'par', 18.00),
  ('RL02', 'Roldana Dupla 30mm', 'roldana', 'par', 28.00),
  ('DB01', 'Dobradica Pivotante', 'dobradica', 'un', 35.00),
  ('TR01', 'Trilho Inferior Aluminio', 'trilho', 'mt', 22.00)
ON CONFLICT DO NOTHING;

-- Accessories de exemplo (globais)
INSERT INTO public.accessories (codigo, nome, tipo, unidade, preco_unitario) VALUES
  ('VD01', 'Vedacao de Borracha EPDM', 'vedacao', 'mt', 3.50),
  ('VD02', 'Fita de Espuma Vedante', 'vedacao', 'mt', 2.80),
  ('PF01', 'Parafuso Autoatarraxante 4x25', 'fixacao', 'cento', 15.00),
  ('SL01', 'Silicone Estrutural 280ml', 'selante', 'un', 28.00),
  ('ES01', 'Escova Vedacao 7x7mm', 'vedacao', 'mt', 4.50)
ON CONFLICT DO NOTHING;
