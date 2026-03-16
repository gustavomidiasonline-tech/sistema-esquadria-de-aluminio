---
id: component-refactoring
---

# Workflow: Refatoração de Componente Monolítico

## Sequência de Agentes

```
@react-refacterer (analisa + extrai) → @domain-dev (testa) → @supabase-architect (se tiver query inline)
```

## Fluxo Completo

### Fase 1 — Análise (react-refacterer)
1. Ler arquivo alvo
2. Contar linhas, useState, handlers
3. Identificar seções visuais
4. Identificar lógica de negócio inline
5. Gerar plano de extração

### Fase 2 — Extração de Lógica (domain-dev — se tiver lógica de negócio)
Se houver cálculos ou regras de negócio no componente:
1. Mover para service correspondente
2. Criar método estático tipado
3. Escrever teste unitário

### Fase 3 — Extração de Componentes (react-refacterer)
1. Criar diretório do módulo
2. Extrair hooks de estado
3. Extrair componentes (bottom-up)
4. Atualizar imports na página original

### Fase 4 — Validação
```bash
npm run lint
npm run typecheck
npm test
```

### Fase 5 — Commit
```bash
git add src/modules/{dominio}/
git add src/pages/{Pagina}.tsx
git commit -m "refactor: quebrar {Pagina}.tsx em sub-componentes [Story REFAT-2.X]"
```

## Critério de Sucesso
- [ ] Página original tem <= 200 linhas
- [ ] Todos os sub-componentes têm props interfaces
- [ ] Zero `any` introduzido
- [ ] Lint e typecheck passam
- [ ] Comportamento visual idêntico
