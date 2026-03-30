-- ============================================================
-- Migration: Fix get_user_company_id() + companies column name
-- Date: 2026-03-30
-- Fixes:
--   1. get_user_company_id() uses profiles.id instead of profiles.user_id
--   2. companies table has 'nome' but triggers insert into 'name'
-- ============================================================

-- 1. Add 'name' column alias if missing (original migration used 'nome')
DO $$
BEGIN
  -- If companies has 'nome' but not 'name', rename to 'name' for consistency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'nome'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.companies RENAME COLUMN nome TO name;
  END IF;
END $$;

-- 2. Fix get_user_company_id() to use user_id instead of id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 3. Fix handle_new_user to handle both column names gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  -- Check if company_id was provided in metadata
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  -- If no company_id, create a new company
  IF v_company_id IS NULL THEN
    v_company_name := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      'Empresa de ' || COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1))
    );

    INSERT INTO public.companies (name, email)
    VALUES (v_company_name, NEW.email)
    RETURNING id INTO v_company_id;
  END IF;

  -- Create profile linked to company
  INSERT INTO public.profiles (user_id, nome, email, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_company_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    company_id = COALESCE(profiles.company_id, EXCLUDED.company_id),
    nome = COALESCE(EXCLUDED.nome, profiles.nome);

  RETURN NEW;
END;
$$;

-- 4. Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Fix auto_provision_company to use consistent column names
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

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION auto_provision_company() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;

-- 7. Fix profiles RLS to allow users to read/update their own profile
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
