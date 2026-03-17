-- Fix: handle_new_user usa colunas 'nome' e 'email' que não existem em companies
-- A tabela companies tem 'name' (não 'nome') e não tem coluna 'email'

-- 1. Adicionar coluna email (opcional) e alias nome se necessário
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Recriar handle_new_user com as colunas corretas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  -- Verificar se há company_id nos metadados
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  -- Se não tem company_id, criar nova empresa
  IF v_company_id IS NULL THEN
    v_company_name := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      'Empresa de ' || COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)
    );

    INSERT INTO public.companies (name, email)
    VALUES (v_company_name, NEW.email)
    RETURNING id INTO v_company_id;
  END IF;

  -- Criar profile vinculado à empresa
  INSERT INTO public.profiles (user_id, nome, email, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    v_company_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    company_id = COALESCE(profiles.company_id, EXCLUDED.company_id);

  RETURN NEW;
END;
$$;

-- 3. Auto-provision para usuários existentes sem empresa
CREATE OR REPLACE FUNCTION public.auto_provision_company()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_nome text;
  v_email text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT company_id, nome, email INTO v_company_id, v_nome, v_email
  FROM profiles
  WHERE user_id = v_user_id;

  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;

  INSERT INTO companies (name, email)
  VALUES (COALESCE(v_nome, 'Minha Empresa'), v_email)
  RETURNING id INTO v_company_id;

  UPDATE profiles
  SET company_id = v_company_id
  WHERE user_id = v_user_id;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION auto_provision_company() TO authenticated;

-- 4. Policy para permitir INSERT em companies por quem não tem empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_can_create_first_company' AND tablename = 'companies'
  ) THEN
    CREATE POLICY "users_can_create_first_company"
      ON public.companies FOR INSERT TO authenticated
      WITH CHECK (
        NOT EXISTS (
          SELECT 1 FROM profiles WHERE user_id = auth.uid() AND company_id IS NOT NULL
        )
      );
  END IF;
END $$;
