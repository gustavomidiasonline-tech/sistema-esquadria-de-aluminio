-- ============================================================
-- FIX v2: Corrigir mismatches entre schema existente e código
-- Corrigido: updated_at deve ser adicionado ANTES de qualquer UPDATE
-- Execute no SQL Editor do projeto gkklumrnzsnytlxscpll
-- ============================================================

-- 1. companies: adicionar updated_at PRIMEIRO (o trigger precisa dessa coluna)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Agora adicionar as outras colunas faltantes
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'basico';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_usuarios INTEGER DEFAULT 3;

-- Agora sim o UPDATE é seguro (updated_at já existe)
UPDATE public.companies SET nome = name WHERE nome IS NULL;

-- 2. cutting_plans: adicionar total_pecas e barras_json
ALTER TABLE public.cutting_plans ADD COLUMN IF NOT EXISTS total_pecas INTEGER DEFAULT 0;
ALTER TABLE public.cutting_plans ADD COLUMN IF NOT EXISTS barras_json JSONB;
UPDATE public.cutting_plans SET total_pecas = total_cortes WHERE total_pecas = 0 AND total_cortes > 0;

-- 3. purchase_order_items: adicionar codigo_material
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS codigo_material TEXT;

-- 4. Recriar handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
  v_nome TEXT;
BEGIN
  v_nome := COALESCE(
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  v_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Empresa de ' || v_nome
  );

  INSERT INTO public.companies (name, nome, email)
  VALUES (v_company_name, v_company_name, NEW.email)
  RETURNING id INTO v_company_id;

  INSERT INTO public.profiles (id, user_id, nome, email, company_id)
  VALUES (NEW.id, NEW.id, v_nome, NEW.email, v_company_id)
  ON CONFLICT (id) DO UPDATE SET
    user_id = COALESCE(profiles.user_id, NEW.id),
    nome = COALESCE(profiles.nome, EXCLUDED.nome),
    company_id = COALESCE(profiles.company_id, EXCLUDED.company_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 5. Recriar auto_provision_company
CREATE OR REPLACE FUNCTION public.auto_provision_company()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_nome text;
  v_email text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT company_id, nome, email
  INTO v_company_id, v_nome, v_email
  FROM profiles WHERE id = v_user_id;

  IF v_company_id IS NOT NULL THEN RETURN v_company_id; END IF;

  INSERT INTO companies (name, nome, email)
  VALUES (COALESCE(v_nome, 'Minha Empresa'), COALESCE(v_nome, 'Minha Empresa'), v_email)
  RETURNING id INTO v_company_id;

  UPDATE profiles SET company_id = v_company_id, user_id = v_user_id
  WHERE id = v_user_id;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION auto_provision_company() TO authenticated;

-- 6. Garantir trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Garantir get_user_company_id funciona
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- PRONTO!
