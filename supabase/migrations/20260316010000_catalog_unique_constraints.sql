-- Unique constraints for catalog import upsert
-- Prevents duplicate perfis and modelos per company

ALTER TABLE public.perfis_catalogo
  ADD CONSTRAINT perfis_catalogo_company_codigo_unique
  UNIQUE (company_id, codigo);

ALTER TABLE public.window_models
  ADD CONSTRAINT window_models_company_codigo_unique
  UNIQUE (company_id, codigo);
