
-- 1. Tabela de Empresas (Tenants)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar company_id ao profiles existente (vincular usuários a empresas)
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- 3. Tabela de Produtos/Modelos (multi-tenant)
CREATE TABLE public.mt_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Perfis de Alumínio (Catálogo de peças - multi-tenant)
CREATE TABLE public.catalog_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  drawing_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Regras de Corte (fórmulas dinâmicas)
CREATE TABLE public.cut_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.mt_products(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.catalog_profiles(id) ON DELETE CASCADE NOT NULL,
  formula TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  angle TEXT DEFAULT '90°',
  axis TEXT NOT NULL CHECK (axis IN ('H', 'L')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Função para obter company_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 7. RLS - Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company"
  ON public.companies FOR SELECT TO authenticated
  USING (id = public.get_user_company_id());

CREATE POLICY "Admins can manage own company"
  ON public.companies FOR ALL TO authenticated
  USING (id = public.get_user_company_id() AND public.has_role(auth.uid(), 'admin'));

-- 8. RLS - mt_products
ALTER TABLE public.mt_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company products"
  ON public.mt_products FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage company products"
  ON public.mt_products FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.has_role(auth.uid(), 'admin'));

-- 9. RLS - catalog_profiles
ALTER TABLE public.catalog_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company catalog"
  ON public.catalog_profiles FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage company catalog"
  ON public.catalog_profiles FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.has_role(auth.uid(), 'admin'));

-- 10. RLS - cut_rules
ALTER TABLE public.cut_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company cut rules"
  ON public.cut_rules FOR SELECT TO authenticated
  USING (product_id IN (SELECT id FROM public.mt_products WHERE company_id = public.get_user_company_id()));

CREATE POLICY "Admins can manage company cut rules"
  ON public.cut_rules FOR ALL TO authenticated
  USING (product_id IN (SELECT id FROM public.mt_products WHERE company_id = public.get_user_company_id()) AND public.has_role(auth.uid(), 'admin'));
