-- ============================================================
-- PHASE 2: Squad Persistence Layer
-- Migration: 20260317200000_squads_persistence_layer.sql
-- Squads: squad-estoque, squad-crm, squad-financeiro
-- ============================================================

-- ============================================================
-- INVENTARIO (squad-estoque)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id   TEXT NOT NULL UNIQUE,
  quantidade    NUMERIC(12,4) NOT NULL DEFAULT 0,
  minimo        NUMERIC(12,4) NOT NULL DEFAULT 0,
  unidade       TEXT NOT NULL DEFAULT 'm²',
  fornecedor    TEXT,
  status        TEXT NOT NULL DEFAULT 'ok'
                  CHECK (status IN ('ok', 'baixo', 'critico')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view inventario"
  ON public.inventario FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage inventario"
  ON public.inventario FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_inventario_updated_at
  BEFORE UPDATE ON public.inventario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_inventario_material_id ON public.inventario(material_id);
CREATE INDEX IF NOT EXISTS idx_inventario_status      ON public.inventario(status);

-- ============================================================
-- RESERVAS (squad-estoque)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reservas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id    TEXT NOT NULL,
  material_id   TEXT NOT NULL REFERENCES public.inventario(material_id) ON DELETE RESTRICT,
  quantidade    NUMERIC(12,4) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'ativa'
                  CHECK (status IN ('ativa', 'liberada', 'cancelada')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view reservas"
  ON public.reservas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage reservas"
  ON public.reservas FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_reservas_reserva_id  ON public.reservas(reserva_id);
CREATE INDEX IF NOT EXISTS idx_reservas_material_id ON public.reservas(material_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status       ON public.reservas(status);

-- ============================================================
-- MOVIMENTACOES (squad-estoque) — histórico de entradas/saídas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id   TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'reabastecimento', 'ajuste')),
  quantidade    NUMERIC(12,4) NOT NULL,
  quantidade_anterior NUMERIC(12,4),
  quantidade_nova     NUMERIC(12,4),
  fornecedor    TEXT,
  observacao    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view movimentacoes"
  ON public.movimentacoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert movimentacoes"
  ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_material_id ON public.movimentacoes(material_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo        ON public.movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_created_at  ON public.movimentacoes(created_at DESC);

-- ============================================================
-- SINCRONIZACOES (squad-estoque) — log de sincronizações com fornecedores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sincronizacoes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinc_id                   TEXT NOT NULL UNIQUE,
  materiais_verificados     INTEGER NOT NULL DEFAULT 0,
  materiais_reabastecidos   INTEGER NOT NULL DEFAULT 0,
  status                    TEXT NOT NULL DEFAULT 'completa',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sincronizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sincronizacoes"
  ON public.sincronizacoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert sincronizacoes"
  ON public.sincronizacoes FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sincronizacoes_created_at ON public.sincronizacoes(created_at DESC);

-- ============================================================
-- VENDAS (squad-financeiro / squad-crm) — movimentos financeiros
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor       NUMERIC(12,2) NOT NULL,
  descricao   TEXT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vendas"
  ON public.vendas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage vendas"
  ON public.vendas FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_vendas_pedido_id  ON public.vendas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_vendas_tipo        ON public.vendas(tipo);
CREATE INDEX IF NOT EXISTS idx_vendas_created_at  ON public.vendas(created_at DESC);

-- ============================================================
-- SEED: Inventário inicial (espelha o in-memory state)
-- ============================================================
INSERT INTO public.inventario (material_id, quantidade, minimo, unidade, fornecedor, status)
VALUES
  ('aluminio_6063',   500, 50,  'm²',      'Aluma Brasil',     'ok'),
  ('vidro_temperado', 300, 30,  'unidades', 'Vidraria Premium', 'ok')
ON CONFLICT (material_id) DO NOTHING;
