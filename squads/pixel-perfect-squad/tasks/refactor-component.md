---
id: refactor-component
agent: react-refacterer
elicit: true
---

# Task: Refatorar Componente Monolítico

## Objetivo
Quebrar um componente/página com excesso de linhas em sub-componentes reutilizáveis,
sem alterar o comportamento visível para o usuário.

## Inputs Necessários (elicit)

1. **Arquivo alvo** — qual arquivo refatorar? (ex: `src/pages/Orcamentos.tsx`)
2. **Prioridade de extração** — o que extrair primeiro? (tabela, form, header, hooks)
3. **Destino dos sub-componentes** — usar `src/modules/` ou `src/components/`?

## Passos

### PASSO 1 — Análise do Arquivo Alvo
```
Leia o arquivo e identifique:
- [ ] Total de linhas
- [ ] Número de useState (>5 = problema)
- [ ] Número de handlers
- [ ] Seções visuais identificáveis (header, filtros, tabela, modals, forms)
- [ ] Lógica de negócio misturada com UI
- [ ] Queries/mutations inline
```

### PASSO 2 — Planejamento da Extração
Crie lista de componentes/hooks a extrair:
```
1. useXxxForm() — estado do formulário
2. useXxxFilters() — estado de filtros/busca
3. XxxTable — tabela/lista principal
4. XxxFormModal — dialog/modal de criação/edição
5. XxxHeader — cabeçalho com título + botão de ação
6. XxxFilters — barra de filtros/busca
```

### PASSO 3 — Criar Diretório do Módulo
```
src/modules/{dominio}/
├── components/
│   ├── {Nome}Table.tsx
│   ├── {Nome}FormModal.tsx
│   ├── {Nome}Header.tsx
│   └── {Nome}Filters.tsx
└── hooks/
    ├── use{Nome}Form.ts
    └── use{Nome}Filters.ts
```

### PASSO 4 — Extrair Hooks Primeiro
- Criar `use{Nome}Form.ts` com todos os useState e handlers do formulário
- Criar hooks de dados usando padrão React Query
- NUNCA deixar lógica de negócio nos hooks (pertence aos services)

### PASSO 5 — Extrair Componentes (bottom-up)
- Extrair componentes folha primeiro (sem sub-componentes)
- Depois os compostos
- A página final deve ser um orchestrator limpo (~80 linhas)

### PASSO 6 — Validação
- [ ] `npm run lint` passa sem erros
- [ ] `npm run typecheck` passa sem erros
- [ ] Comportamento visual idêntico ao original
- [ ] Props interfaces definidas para todos os novos componentes
- [ ] Nenhum `any` introduzido

## Regras Críticas

- NÃO quebrar comportamento — zero regressões
- NÃO mover lógica de negócio para componentes — vai para services
- NÃO usar imports relativos — sempre `@/`
- Commits atômicos: um commit por componente extraído

## Exemplo de Resultado (Orcamentos.tsx)

```
ANTES: src/pages/Orcamentos.tsx (506 linhas)

DEPOIS:
src/pages/Orcamentos.tsx (~80 linhas)
src/modules/orcamentos/components/OrcamentosHeader.tsx (~30 linhas)
src/modules/orcamentos/components/OrcamentosTable.tsx (~100 linhas)
src/modules/orcamentos/components/OrcamentosFilters.tsx (~60 linhas)
src/modules/orcamentos/components/OrcamentoFormModal.tsx (~120 linhas)
src/modules/orcamentos/hooks/useOrcamentoForm.ts (~60 linhas)
src/modules/orcamentos/hooks/useOrcamentosFilter.ts (~40 linhas)
```
