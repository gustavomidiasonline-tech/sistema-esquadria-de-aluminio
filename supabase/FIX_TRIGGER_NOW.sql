-- ============================================================
-- FIX URGENTE: Corrigir handle_new_user e auto_provision_company
-- A tabela companies usa coluna "nome" (não "name")
-- Execute AGORA no Supabase SQL Editor
-- ============================================================

-- 1. Corrigir handle_new_user (trigger que roda no signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  IF v_company_id IS NULL THEN
    v_company_name := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      'Empresa de ' || COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)
    );

    INSERT INTO public.companies (nome, email)
    VALUES (v_company_name, NEW.email)
    RETURNING id INTO v_company_id;
  END IF;

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

-- 2. Corrigir auto_provision_company (RPC chamada no login)
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

  INSERT INTO companies (nome, email)
  VALUES (COALESCE(v_nome, 'Minha Empresa'), v_email)
  RETURNING id INTO v_company_id;

  UPDATE profiles
  SET company_id = v_company_id
  WHERE user_id = v_user_id;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION auto_provision_company() TO authenticated;

-- 3. Limpar usuários órfãos que falharam no signup anterior
-- (auth.users que existem mas não têm profile)
-- Descomente se quiser limpar:
-- DELETE FROM auth.users WHERE id NOT IN (SELECT user_id FROM public.profiles);

-- PRONTO! Agora tente cadastrar/logar novamente.
