
-- Pricing configuration table for real cost calculations
CREATE TABLE public.config_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  unidade TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.config_precos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view config_precos" ON public.config_precos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage config_precos" ON public.config_precos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default pricing values
INSERT INTO public.config_precos (chave, valor, descricao, unidade) VALUES
  ('preco_kg_aluminio', 38.00, 'Preço do kg de alumínio (barra)', 'R$/kg'),
  ('preco_m2_vidro_temperado_6mm', 105.00, 'Vidro temperado incolor 6mm', 'R$/m²'),
  ('preco_m2_vidro_temperado_8mm', 135.00, 'Vidro temperado incolor 8mm', 'R$/m²'),
  ('preco_m2_vidro_temperado_10mm', 165.00, 'Vidro temperado incolor 10mm', 'R$/m²'),
  ('preco_m2_vidro_laminado_8mm', 180.00, 'Vidro laminado incolor 8mm', 'R$/m²'),
  ('preco_m2_vidro_comum_4mm', 65.00, 'Vidro comum incolor 4mm', 'R$/m²'),
  ('custo_ferragem_janela', 45.00, 'Kit ferragem janela de correr (média)', 'R$/un'),
  ('custo_ferragem_porta', 120.00, 'Kit ferragem porta (média)', 'R$/un'),
  ('custo_ferragem_basculante', 35.00, 'Kit ferragem basculante', 'R$/un'),
  ('custo_ferragem_maximar', 55.00, 'Kit ferragem maxim-ar', 'R$/un'),
  ('custo_ferragem_pivotante', 280.00, 'Kit ferragem pivotante', 'R$/un'),
  ('custo_acessorios_padrao', 25.00, 'Acessórios padrão (silicone, borracha, parafusos)', 'R$/un'),
  ('markup_padrao', 35.00, 'Markup padrão sobre custo de material', '%'),
  ('custo_mao_de_obra_hora', 45.00, 'Custo mão de obra por hora', 'R$/hora'),
  ('horas_producao_janela', 2.5, 'Horas produção janela padrão', 'horas'),
  ('horas_producao_porta', 4.0, 'Horas produção porta padrão', 'horas'),
  ('horas_instalacao_padrao', 1.5, 'Horas instalação padrão', 'horas');

-- Add cost tracking columns to orcamento_itens
ALTER TABLE public.orcamento_itens 
  ADD COLUMN IF NOT EXISTS custo_aluminio NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_vidro NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_ferragem NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_acessorios NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_mao_obra NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markup_percentual NUMERIC DEFAULT 35,
  ADD COLUMN IF NOT EXISTS lucro NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tipo_vidro TEXT DEFAULT 'temperado_6mm',
  ADD COLUMN IF NOT EXISTS peso_total_kg NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS area_vidro_m2 NUMERIC DEFAULT 0;
