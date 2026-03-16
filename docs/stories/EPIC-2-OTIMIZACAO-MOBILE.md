# EPIC-2: Otimizacao Mobile/Tablet

**Status:** Draft
**Prioridade:** Alta
**Estimativa Total:** 1-3 semanas
**Ultima atualizacao:** 2026-03-16 (PM/Morgan)

---

## Contexto

O sistema atual foi construido com Vite + React + Tailwind + shadcn-ui e possui diversas telas e componentes complexos. O objetivo deste epic e otimizar o sistema inteiro para uso em mobile e tablet, garantindo usabilidade, legibilidade e fluxos completos sem regressao das funcionalidades atuais.

---

## Objetivo

Garantir que todas as telas, fluxos e componentes do sistema sejam 100% funcionais e confortaveis em mobile e tablet, com layout responsivo, navegacao adequada e sem quebra de UI.

---

## Escopo

- Responsividade global (layouts, grids, cards, tabelas, modais, drawers)
- Navegacao mobile (sidebar/drawer, header, menus e breadcrumbs)
- Ajustes por pagina para garantir uso completo em telas pequenas e medias
- Validacao visual e funcional em breakpoints mobile e tablet

---

## Stories do Epic

### FASE 1 — Fundacao Responsiva

- [ ] **Story 6.1** — Base responsiva e navegacao mobile
  - Descricao: Ajustar layout global, AppLayout/AppSidebar/AppHeader, grids e containers para mobile e tablet. Garantir navegacao usavel em telas pequenas.
  - **Executor Assignment**: executor: @ux-design-expert, quality_gate: @dev
  - **Quality Gate Tools**: [a11y_validation, responsive_review]
  - **Quality Gates**:
    - Pre-Commit: A11y basico e responsividade
    - Pre-PR: Revisao visual e regressao de layout

- [ ] **Story 6.2** — Ajustes responsivos por pagina (core)
  - Descricao: Aplicar ajustes responsivos nas paginas principais e componentes de alto uso (orcamentos, pedidos, estoque, configuracoes, financeiro, producao, servicos).
  - **Executor Assignment**: executor: @ux-design-expert, quality_gate: @dev
  - **Quality Gate Tools**: [responsive_review, visual_regression]
  - **Quality Gates**:
    - Pre-Commit: Verificacao de breakpoints
    - Pre-PR: Revisao de fluxos mobile e tablet

- [ ] **Story 6.3** — Tabelas, graficos e modais responsivos
  - Descricao: Garantir que tabelas, graficos, modais e dialogs funcionem em mobile/tablet (scroll horizontal, colapsos, drawers quando necessario).
  - **Executor Assignment**: executor: @ux-design-expert, quality_gate: @dev
  - **Quality Gate Tools**: [responsive_review, a11y_validation]
  - **Quality Gates**:
    - Pre-Commit: Verificacao de overflow e acessibilidade
    - Pre-PR: Revisao de uso em touch

---

## Requisitos de Compatibilidade

- [ ] Nenhuma funcionalidade atual pode regredir
- [ ] Fluxos principais devem continuar completos em desktop
- [ ] UI deve manter consistencia com o design atual (glassmorphism)
- [ ] Performance nao deve degradar perceptivelmente

---

## Riscos e Mitigacao

- **Risco Principal:** Quebra de layout ou regressao de fluxo em telas pequenas
- **Mitigacao:** Revisao por breakpoints, testes manuais em mobile/tablet, revisao visual por componente
- **Plano de Rollback:** Reverter alteracoes de CSS/estrutura caso ocorra regressao critica

---

## Definition of Done

- [ ] Todas as stories concluidas com AC atendidos
- [ ] Fluxos principais usaveis em mobile e tablet
- [ ] Nenhuma regressao funcional detectada
- [ ] Validacao visual concluida em breakpoints mobile e tablet

---

*Epic criado por Morgan (pm) — 2026-03-16*
