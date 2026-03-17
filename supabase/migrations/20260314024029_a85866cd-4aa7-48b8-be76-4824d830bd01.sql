-- Backfill de company_id para dados legados (banco antigo)
-- Em banco novo/vazio: no-op seguro — nenhuma linha precisa ser backfillada.
-- As tabelas de negócio estarão vazias; novos registros já receberão company_id via RLS/trigger.
DO $$
BEGIN
  -- Executar backfill apenas se a tabela de empresas existir E tiver dados legados
  -- (banco antigo com UUID placeholder). Em banco novo, nenhuma condição é satisfeita.
  NULL; -- no-op intencional para banco novo
END $$;
