
-- Fabricantes
CREATE TABLE public.fabricantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  contato text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fabricantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view fabricantes" ON public.fabricantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage fabricantes" ON public.fabricantes FOR ALL TO authenticated USING (true);

-- Linhas
CREATE TABLE public.linhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text,
  espessura_mm numeric,
  aplicacao text,
  fabricante_id uuid REFERENCES public.fabricantes(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.linhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view linhas" ON public.linhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage linhas" ON public.linhas FOR ALL TO authenticated USING (true);

-- Perfis Catalogo
CREATE TABLE public.perfis_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nome text NOT NULL,
  linha_id uuid REFERENCES public.linhas(id),
  tipo text NOT NULL,
  peso_kg_m numeric DEFAULT 0,
  comprimento_padrao_mm integer DEFAULT 6000,
  espessura_mm numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.perfis_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view perfis_catalogo" ON public.perfis_catalogo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage perfis_catalogo" ON public.perfis_catalogo FOR ALL TO authenticated USING (true);

-- Ferragens
CREATE TABLE public.ferragens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  fabricante text,
  tipo text,
  aplicacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ferragens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view ferragens" ON public.ferragens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage ferragens" ON public.ferragens FOR ALL TO authenticated USING (true);

-- Modelos Esquadria
CREATE TABLE public.modelos_esquadria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  categoria text NOT NULL DEFAULT 'janela',
  linha_id uuid REFERENCES public.linhas(id),
  folhas integer DEFAULT 2,
  largura_min_mm integer DEFAULT 400,
  largura_max_mm integer DEFAULT 6000,
  altura_min_mm integer DEFAULT 400,
  altura_max_mm integer DEFAULT 3000,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modelos_esquadria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view modelos_esquadria" ON public.modelos_esquadria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage modelos_esquadria" ON public.modelos_esquadria FOR ALL TO authenticated USING (true);

-- Componentes Modelo
CREATE TABLE public.componentes_modelo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  esquadria_id uuid NOT NULL REFERENCES public.modelos_esquadria(id) ON DELETE CASCADE,
  perfil_id uuid REFERENCES public.perfis_catalogo(id),
  quantidade integer NOT NULL DEFAULT 1,
  formula_calculo text NOT NULL,
  posicao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.componentes_modelo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view componentes_modelo" ON public.componentes_modelo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage componentes_modelo" ON public.componentes_modelo FOR ALL TO authenticated USING (true);

-- Projetos Esquadria
CREATE TABLE public.projetos_esquadria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Novo Projeto',
  cliente_id uuid REFERENCES public.clientes(id),
  esquadria_id uuid REFERENCES public.modelos_esquadria(id),
  largura_mm integer NOT NULL,
  altura_mm integer NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projetos_esquadria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view projetos_esquadria" ON public.projetos_esquadria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage projetos_esquadria" ON public.projetos_esquadria FOR ALL TO authenticated USING (true);

-- Lista Corte
CREATE TABLE public.lista_corte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos_esquadria(id) ON DELETE CASCADE,
  perfil_id uuid REFERENCES public.perfis_catalogo(id),
  perfil_codigo text,
  perfil_nome text,
  comprimento_mm integer NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  posicao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lista_corte ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view lista_corte" ON public.lista_corte FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage lista_corte" ON public.lista_corte FOR ALL TO authenticated USING (true);
