---
id: refactoring-gate
---

# Checklist: Gate de Qualidade — Refatoração

Execute este checklist ANTES de fazer commit de qualquer refatoração.

## Regras Estruturais
- [ ] Página/componente alvo tem <= 200 linhas (página) ou <= 150 linhas (componente)
- [ ] Toda interface de props está definida com `interface XxxProps {}`
- [ ] Nenhum `any` foi introduzido (usar `unknown` + type guards)
- [ ] Imports absolutos com `@/` — nenhum relativo `../../`
- [ ] Ordem de imports seguida (core → external → ui → hooks → services → types)

## Comportamento
- [ ] Funcionalidade visível está idêntica ao original
- [ ] Formulários submetem e validam igual ao original
- [ ] Modals/dialogs abrem e fecham corretamente
- [ ] Tabelas carregam dados com o mesmo filtro/ordenação
- [ ] Mensagens de erro/sucesso (toasts) aparecem nos mesmos momentos

## Arquitetura
- [ ] Lógica de negócio foi movida para service (não está no hook nem no componente)
- [ ] Queries Supabase estão nos repositories (não diretamente no hook)
- [ ] Handlers não estão inline no JSX
- [ ] Estado de loading/error tratado em todos os hooks

## Quality Gates Automáticos
```bash
npm run lint        # [ ] zero warnings e erros
npm run typecheck   # [ ] zero erros TypeScript
npm test            # [ ] todos os testes passam
```

## Aprovação
- [ ] Revisão visual no browser (localhost:5173)
- [ ] Nenhuma regressão identificada
- [ ] Commit message no padrão: `refactor: {descrição} [Story REFAT-X.X]`
