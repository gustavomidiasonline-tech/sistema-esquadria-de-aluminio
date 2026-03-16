---
id: feature-development
---

# Workflow: Desenvolvimento de Nova Feature

## Sequência de Agentes

```
@supabase-architect (schema) → @domain-dev (service + repository + hook) → @react-refacterer (UI) → @domain-dev (testes)
```

## Fluxo Completo

### Fase 1 — Schema (supabase-architect)
Se a feature precisar de novas tabelas/colunas:
1. Task: `migrate-schema`
2. Aplicar migration
3. Regenerar types TypeScript

### Fase 2 — Camada de Dados (domain-dev)
1. Criar/atualizar repository em `src/repositories/`
2. Criar/atualizar service em `src/services/`
3. Criar hook em `src/hooks/`

### Fase 3 — UI (react-refacterer)
1. Criar componentes em `src/modules/{dominio}/components/`
2. Criar hooks de UI em `src/modules/{dominio}/hooks/`
3. Atualizar página em `src/pages/` (max 200 linhas)
4. Rotas em `src/App.tsx` se nova página

### Fase 4 — Testes (domain-dev)
1. Testes unitários para service
2. Testes de integração para repository (opcional)

### Fase 5 — Quality Gate
```bash
npm run lint       # zero erros
npm run typecheck  # zero erros
npm test           # todos passam
npm run build      # build sucesso
```

## Exemplos de Features por Agente Principal

| Feature | Agente Lead | Tasks |
|---------|------------|-------|
| Catálogo de vidros | supabase-architect + domain-dev | migrate-schema + create-repository |
| Ordem de produção automática | domain-dev + esquadria-engineer | create-service + optimize-cutting-plan |
| Refatorar Orcamentos.tsx | react-refacterer | refactor-component |
| Multitenancy | supabase-architect | implement-multitenancy |
| Testes do motor de cálculo | domain-dev + esquadria-engineer | add-unit-tests + optimize-cutting-plan |
