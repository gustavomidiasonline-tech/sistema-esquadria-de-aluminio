# EPIC-1: Refatoração e Evolução do SaaS de Esquadrias

**Status:** In Progress 🔄
**Prioridade:** Alta
**Estimativa Total:** 5-6 semanas
**Última atualização:** 2026-03-15 (Pax/po)

---

## Contexto

O projeto `pixel-perfect-pixels` foi gerado pelo Lovable como protótipo funcional de um SaaS para vidraçarias e fábricas de esquadrias de alumínio. O sistema possui funcionalidades completas mas arquitetura imatura: componentes monolíticos, ausência de service layer, lógica de negócio misturada com UI, e sem suporte multitenancy.

**Objetivo:** Transformar o protótipo em um SaaS escalável, modular e pronto para produção.

---

## Stories do Epic

### FASE 1 — Fundação Arquitetural

- [x] [Story 1.1](./1.1.story.md) — Estrutura de Diretórios Modular ✅ Done
- [x] [Story 1.2](./1.2.story.md) — Service Layer (5 services, 30 testes) ✅ Done
- [ ] [Story 1.2-fix](./1.2-fix.story.md) — Testes faltantes (orcamento + production) 🔴 Ready
- [ ] [Story 1.3](./1.3.story.md) — Hooks Específicos + Estrutura de Módulos 🔴 Ready

### FASE 2 — Componentização

- [ ] [Story 2.1](./2.1.story.md) — Refatorar Orcamentos.tsx 🔴 Ready
- [ ] [Story 2.2](./2.2.story.md) — DataTable Genérico Reutilizável 🔴 Ready
- [ ] [Story 2.3](./2.3.story.md) — AppSidebar Navigation Config ⬜ Draft
- [ ] [Story 2.4](./2.4.story.md) — StatusBadge e Helpers Compartilhados ⬜ Draft

### FASE 3 — Banco de Dados e Multitenancy

- [ ] [Story 3.1](./3.1.story.md) — Tabela `companies` (Multitenancy) 🔴 Ready
- [ ] [Story 3.2](./3.2.story.md) — Tabelas `window_models` + `window_parts` 🔴 Ready
- [ ] [Story 3.3](./3.3.story.md) — Tabela `production_orders` 🔴 Ready
- [ ] [Story 3.4](./3.4.story.md) — RLS Isolation por Company ⬜ Draft

### FASE 4 — Motores de Negócio

- [x] Motor de Cálculo de Esquadrias — implementado em `esquadria.service.ts` ✅
- [x] Algoritmo FFD + Best Fit — implementado em `cutting.service.ts` ✅
- [x] Sistema de Orçamento Automático — implementado em `orcamento.service.ts` ✅
- [x] Geração de Ordem de Produção — implementado em `production.service.ts` ✅
- [ ] [Story 4.1](./4.1.story.md) — Integrar Motor nos Componentes UI ⬜ Draft
- [ ] [Story 4.2](./4.2.story.md) — Integrar CuttingService no PlanoDeCorte.tsx ⬜ Draft

### FASE 5 — Qualidade e Segurança

- [ ] [Story 5.1](./5.1.story.md) — Testes Unitários Completos (>80%) ⬜ Draft
- [ ] [Story 5.2](./5.2.story.md) — Error Handling Centralizado ⬜ Draft
- [ ] [Story 5.3](./5.3.story.md) — Validação RLS Robusta ⬜ Draft

---

## Progresso Atual

| Fase | Total | Done | Ready | Draft |
|------|-------|------|-------|-------|
| Fase 1 | 4 | 2 | 2 | 0 |
| Fase 2 | 4 | 0 | 2 | 2 |
| Fase 3 | 4 | 0 | 3 | 1 |
| Fase 4 | 6 | 4 | 0 | 2 |
| Fase 5 | 3 | 0 | 0 | 3 |
| **Total** | **21** | **6** | **7** | **8** |

---

## Próximas Stories Priorizadas (Sprint Atual)

1. **Story 1.2-fix** — Completar testes (bloqueia QA gate da 1.2)
2. **Story 2.2** — DataTable genérico (desbloqueador para 2.1)
3. **Story 1.3** — Hooks específicos
4. **Story 2.1** — Refatorar Orcamentos.tsx
5. **Stories 3.1, 3.2, 3.3** — Aplicar migrations Supabase

---

## Critérios de Conclusão do Epic

- [ ] Todos os componentes têm máximo de 200 linhas
- [ ] Toda lógica de negócio está em `src/services/`
- [ ] Isolamento por empresa (multitenancy) funcionando
- [ ] Motor de cálculo integrado nos componentes UI
- [ ] Plano de corte com algoritmo otimizado
- [ ] Orçamento → Pedido → Produção flow automático
- [ ] Cobertura de testes > 80% nos services
- [ ] Zero vulnerabilidades críticas de segurança
- [ ] `npm run lint`, `npm run typecheck`, `npm test` passando

---

*Epic criado por Orion (aios-master) — 2026-03-15 | Atualizado por Pax (po) — 2026-03-15*
