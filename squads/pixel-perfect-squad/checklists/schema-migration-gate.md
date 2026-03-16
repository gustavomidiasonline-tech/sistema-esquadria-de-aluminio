---
id: schema-migration-gate
---

# Checklist: Gate de Validação — Migration Supabase

Execute ANTES de aplicar qualquer migration em produção.

## Revisão do SQL
- [ ] Usa `CREATE TABLE IF NOT EXISTS` (idempotente)
- [ ] Usa `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` presente
- [ ] RLS policies criadas para SELECT, INSERT, UPDATE, DELETE conforme acesso
- [ ] Índices em todas as FKs (`company_id`, `user_id`, `pedido_id`, etc.)
- [ ] Trigger `updated_at` criado (se tabela tem `updated_at`)
- [ ] Comentário de rollback no final do arquivo

## Impacto em Dados Existentes
- [ ] Se adicionar coluna NOT NULL: tem DEFAULT ou script de backfill
- [ ] Se renomear coluna: frontend atualizado para novo nome
- [ ] Se remover coluna: todos os usos removidos do código antes da migration

## Multitenancy
- [ ] Se nova tabela tem dados por empresa: `company_id UUID REFERENCES companies(id)` presente
- [ ] RLS policy de isolamento de tenant adicionada

## Testes
```bash
# Testar migration em ambiente local
supabase db reset --local   # reset completo + aplica todas as migrations
supabase migration list      # confirmar que aparece como aplicada
```

## Aprovação
- [ ] Migration aplicada com sucesso no ambiente local
- [ ] TypeScript types regenerados (`supabase gen types typescript`)
- [ ] Nenhum erro de compilação após regenerar types
- [ ] Repository/hooks atualizados para usar novas colunas
