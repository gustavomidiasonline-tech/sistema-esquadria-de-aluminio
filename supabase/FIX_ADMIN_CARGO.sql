-- ============================================================
-- FIX: Garantir que todo usuário novo receba cargo = 'admin'
-- Execute no SQL Editor do projeto gkklumrnzsnytlxscpll
-- ============================================================

-- 1. Garantir que a coluna cargo existe em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT DEFAULT 'admin';

-- 2. Atualizar usuários existentes sem cargo
UPDATE public.profiles SET cargo = 'admin' WHERE cargo IS NULL OR cargo = '';

-- 3. Recriar handle_new_user com cargo = 'admin' no INSERT
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

  -- Criar empresa automaticamente
  INSERT INTO public.companies (nome, email)
  VALUES (v_company_name, NEW.email)
  RETURNING id INTO v_company_id;

  -- Criar profile com cargo = 'admin' (acesso total por padrão)
  INSERT INTO public.profiles (id, user_id, nome, full_name, email, company_id, cargo)
  VALUES (
    NEW.id,
    NEW.id,
    v_nome,
    v_nome,
    NEW.email,
    v_company_id,
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id      = COALESCE(profiles.user_id, NEW.id),
    nome         = COALESCE(profiles.nome, EXCLUDED.nome),
    company_id   = COALESCE(profiles.company_id, EXCLUDED.company_id),
    cargo        = COALESCE(profiles.cargo, 'admin');

  -- Criar role admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRONTO! Todo novo cadastro recebe cargo='admin' e aparece em Administradores.
