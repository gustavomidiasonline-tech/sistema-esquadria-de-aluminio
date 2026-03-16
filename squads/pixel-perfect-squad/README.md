# pixel-perfect-squad

Squad especializado para o ERP/CRM de vidraçarias — `pixel-perfect-pixels`.

## Contexto do Projeto

**Sistema:** ERP/CRM para vidraçarias e fábricas de esquadrias de alumínio
**Stack:** React 18 + TypeScript + Vite + TailwindCSS + Supabase
**Origem:** Protótipo Lovable em processo de refatoração arquitetural

## Agentes

| Agente | Nome | Especialidade |
|--------|------|---------------|
| `esquadria-engineer` | Vitor | Cálculo de esquadrias, algoritmo FFD/BFD, perfis de alumínio |
| `supabase-architect` | Dara | Schema Supabase, RLS, migrations, multitenancy |
| `react-refacterer` | Luna | Refatoração de componentes React monolíticos |
| `domain-dev` | Dex | Services, repositories, hooks, testes unitários |

## Plano de Refatoração (da Análise Brownfield)

### Prioridade 1 — Fundação ✅ Iniciada
- [x] Estrutura de diretórios modular (`src/services/`, `src/repositories/`, `src/modules/`)
- [ ] Completar service layer para todos os domínios
- [ ] Hooks específicos por entidade (substituir `useSupabaseQuery<T = any>`)

### Prioridade 2 — Componentização 🚧 Em andamento
- [ ] `Orcamentos.tsx` (506 linhas) → quebrar em sub-componentes
- [ ] `ConfiguracaoModelos.tsx` (471 linhas)
- [ ] `Servicos.tsx` (423 linhas)
- [ ] `DataTable` genérico reutilizável
- [ ] `StatusBadge` compartilhado

### Prioridade 3 — Banco & Multitenancy ❌ Pendente
- [ ] Tabela `companies` + RLS de isolamento (CRÍTICO)
- [ ] `window_models` + `window_parts`
- [ ] `production_orders`
- [ ] Adicionar `company_id` nas tabelas principais

### Prioridade 4 — Motores ❌ Pendente
- [ ] Otimizar FFD → BFD no plano de corte
- [ ] Lista de materiais automática por orçamento
- [ ] Geração de ordem de produção automática

### Prioridade 5 — Qualidade ❌ Pendente
- [ ] Testes unitários para `calculo-esquadria.ts`
- [ ] Testes unitários para `cutting.service.ts`
- [ ] Testes unitários para `pricing.service.ts`
- [ ] Error handling centralizado

## Uso Rápido

```bash
# Para refatorar um componente monolítico:
@react-refacterer *refactor src/pages/Orcamentos.tsx

# Para criar migration Supabase:
@supabase-architect *create-migration companies

# Para implementar multitenancy:
@supabase-architect *implement-multitenancy

# Para otimizar o algoritmo de corte:
@esquadria-engineer *optimize-ffd

# Para adicionar testes:
@domain-dev *add-tests cutting.service
```

## Arquivos Importantes do Projeto

| Arquivo | Descrição |
|---------|-----------|
| [src/lib/calculo-esquadria.ts](../../src/lib/calculo-esquadria.ts) | Motor de cálculo principal |
| [src/services/cutting.service.ts](../../src/services/cutting.service.ts) | Algoritmo de plano de corte |
| [src/pages/Orcamentos.tsx](../../src/pages/Orcamentos.tsx) | Maior alvo de refatoração (506 linhas) |
| [supabase/migrations/](../../supabase/migrations/) | Histórico de migrations |
| [docs/BROWNFIELD-ANALYSIS.md](../../docs/BROWNFIELD-ANALYSIS.md) | Análise completa do sistema |

## Padrões do Squad

Ver:
- [config/coding-standards.md](config/coding-standards.md)
- [config/tech-stack.md](config/tech-stack.md)
- [config/source-tree.md](config/source-tree.md)
