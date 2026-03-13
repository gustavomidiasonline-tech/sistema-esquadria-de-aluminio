
-- ============================================
-- UTILITY: timestamp trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- USER ROLES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'funcionario');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  telefone TEXT,
  cargo TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'funcionario');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CLIENTES
-- ============================================
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf_cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view clientes" ON public.clientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert clientes" ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update clientes" ON public.clientes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete clientes" ON public.clientes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PRODUTOS
-- ============================================
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  folhas INTEGER DEFAULT 2,
  largura_padrao INTEGER,
  altura_padrao INTEGER,
  descricao TEXT,
  preco NUMERIC(12,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view produtos" ON public.produtos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage produtos" ON public.produtos
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PERFIS DE ALUMINIO
-- ============================================
CREATE TABLE public.perfis_aluminio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  codigo TEXT NOT NULL,
  descricao TEXT,
  medida INTEGER NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  angulo_esquerdo NUMERIC(5,1) DEFAULT 90,
  angulo_direito NUMERIC(5,1) DEFAULT 90,
  posicao TEXT NOT NULL,
  peso_metro NUMERIC(8,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.perfis_aluminio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view perfis" ON public.perfis_aluminio
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage perfis" ON public.perfis_aluminio
  FOR ALL TO authenticated USING (true);

-- ============================================
-- PLANOS DE CORTE
-- ============================================
CREATE TABLE public.planos_de_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos(id),
  largura INTEGER NOT NULL,
  altura INTEGER NOT NULL,
  descricao TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_de_corte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view planos" ON public.planos_de_corte
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage planos" ON public.planos_de_corte
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON public.planos_de_corte
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ORCAMENTOS
-- ============================================
CREATE TYPE public.orcamento_status AS ENUM ('rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado');

CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  cliente_id UUID REFERENCES public.clientes(id),
  status orcamento_status NOT NULL DEFAULT 'rascunho',
  valor_total NUMERIC(12,2) DEFAULT 0,
  descricao TEXT,
  validade DATE,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view orcamentos" ON public.orcamentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage orcamentos" ON public.orcamentos
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id),
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  largura INTEGER,
  altura INTEGER,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view orcamento_itens" ON public.orcamento_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage orcamento_itens" ON public.orcamento_itens
  FOR ALL TO authenticated USING (true);

-- ============================================
-- PEDIDOS
-- ============================================
CREATE TYPE public.pedido_status AS ENUM ('pendente', 'em_producao', 'pronto', 'entregue', 'cancelado');

CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  cliente_id UUID REFERENCES public.clientes(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  status pedido_status NOT NULL DEFAULT 'pendente',
  valor_total NUMERIC(12,2) DEFAULT 0,
  endereco_entrega TEXT,
  data_entrega DATE,
  observacoes TEXT,
  vendedor TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pedidos" ON public.pedidos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage pedidos" ON public.pedidos
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id),
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  largura INTEGER,
  altura INTEGER,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pedido_itens" ON public.pedido_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage pedido_itens" ON public.pedido_itens
  FOR ALL TO authenticated USING (true);

-- ============================================
-- SERVICOS
-- ============================================
CREATE TYPE public.servico_status AS ENUM ('agendado', 'em_andamento', 'concluido', 'cancelado');

CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  cliente_id UUID REFERENCES public.clientes(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  tipo TEXT,
  status servico_status NOT NULL DEFAULT 'agendado',
  descricao TEXT,
  endereco TEXT,
  data_agendada DATE,
  data_conclusao DATE,
  responsavel TEXT,
  valor NUMERIC(12,2),
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view servicos" ON public.servicos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage servicos" ON public.servicos
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FINANCEIRO: CONTAS A RECEBER
-- ============================================
CREATE TYPE public.conta_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');

CREATE TABLE public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status conta_status NOT NULL DEFAULT 'pendente',
  forma_pagamento TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view contas_receber" ON public.contas_receber
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage contas_receber" ON public.contas_receber
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_contas_receber_updated_at
  BEFORE UPDATE ON public.contas_receber
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FINANCEIRO: CONTAS A PAGAR
-- ============================================
CREATE TABLE public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status conta_status NOT NULL DEFAULT 'pendente',
  categoria TEXT,
  forma_pagamento TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view contas_pagar" ON public.contas_pagar
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage contas_pagar" ON public.contas_pagar
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_contas_pagar_updated_at
  BEFORE UPDATE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FINANCEIRO: NOTAS FISCAIS
-- ============================================
CREATE TYPE public.nf_status AS ENUM ('emitida', 'cancelada', 'pendente');
CREATE TYPE public.nf_tipo AS ENUM ('nfe', 'nfse', 'nfce');

CREATE TABLE public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT,
  tipo nf_tipo NOT NULL DEFAULT 'nfe',
  cliente_id UUID REFERENCES public.clientes(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  valor NUMERIC(12,2) NOT NULL,
  status nf_status NOT NULL DEFAULT 'pendente',
  data_emissao DATE,
  descricao TEXT,
  xml_url TEXT,
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view notas_fiscais" ON public.notas_fiscais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage notas_fiscais" ON public.notas_fiscais
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_notas_fiscais_updated_at
  BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FINANCEIRO: CONTRATOS
-- ============================================
CREATE TYPE public.contrato_status AS ENUM ('ativo', 'encerrado', 'cancelado', 'rascunho');

CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(12,2),
  data_inicio DATE,
  data_fim DATE,
  status contrato_status NOT NULL DEFAULT 'rascunho',
  arquivo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view contratos" ON public.contratos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage contratos" ON public.contratos
  FOR ALL TO authenticated USING (true);

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FINANCEIRO: DOCUMENTOS
-- ============================================
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo TEXT,
  descricao TEXT,
  arquivo_url TEXT,
  tamanho_bytes BIGINT,
  cliente_id UUID REFERENCES public.clientes(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view documentos" ON public.documentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage documentos" ON public.documentos
  FOR ALL TO authenticated USING (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('contratos', 'contratos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('notas-fiscais', 'notas-fiscais', false);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated can view docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id IN ('documentos', 'contratos', 'notas-fiscais'));

CREATE POLICY "Authenticated can upload docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('documentos', 'contratos', 'notas-fiscais'));

CREATE POLICY "Authenticated can update docs" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id IN ('documentos', 'contratos', 'notas-fiscais'));

CREATE POLICY "Admins can delete docs" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id IN ('documentos', 'contratos', 'notas-fiscais') 
    AND public.has_role(auth.uid(), 'admin')
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_clientes_nome ON public.clientes(nome);
CREATE INDEX idx_clientes_cpf_cnpj ON public.clientes(cpf_cnpj);
CREATE INDEX idx_orcamentos_cliente ON public.orcamentos(cliente_id);
CREATE INDEX idx_orcamentos_status ON public.orcamentos(status);
CREATE INDEX idx_pedidos_cliente ON public.pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON public.pedidos(status);
CREATE INDEX idx_servicos_cliente ON public.servicos(cliente_id);
CREATE INDEX idx_servicos_status ON public.servicos(status);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX idx_notas_fiscais_cliente ON public.notas_fiscais(cliente_id);
CREATE INDEX idx_contratos_cliente ON public.contratos(cliente_id);
CREATE INDEX idx_planos_corte_produto ON public.planos_de_corte(produto_id);
