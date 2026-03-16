# Relatório de Análise Brownfield — pixel-perfect-pixels
**Data:** 2026-03-15
**Agente:** Orion (aios-master)
**Status:** Análise completa — pronto para refatoração

---

## 1. VISÃO GERAL DO PROJETO

**Sistema:** ERP/CRM para vidraçarias e fábricas de esquadrias de alumínio
**Origem:** Gerado pelo Lovable (protótipo funcional)
**Stack:** React 18 + TypeScript + Vite + TailwindCSS + Supabase (PostgreSQL)
**Tamanho:** ~5.000 linhas de código React, ~30 tabelas Supabase, 14 migrações

### Funcionalidades Implementadas

| Módulo | Status | Qualidade Arquitetural |
|--------|--------|----------------------|
| Autenticação (Supabase Auth) | ✅ Completo | 🟢 Boa |
| Dashboard / KPIs | ✅ Completo | 🟡 Moderada |
| Orçamentos | ✅ Completo | 🔴 Ruim (506 linhas) |
| Pedidos | ✅ Completo | 🟡 Moderada |
| Serviços | ✅ Completo | 🟡 Moderada |
| Esquadrias (3D Viewer) | ✅ Completo | 🟡 Moderada |
| Plano de Corte (FFD) | ✅ Completo | 🟡 Moderada |
| Financeiro (9 sub-módulos) | ✅ Completo | 🟡 Moderada |
| Clientes/Fornecedores | ✅ Completo | 🟡 Moderada |
| Workflow | ✅ Completo | 🟡 Moderada |
| Relatórios | ✅ Completo | 🟡 Moderada |
| Sistema de Planos (3 tiers) | ✅ Completo | 🟢 Boa |
| Agenda | ✅ Completo | 🟢 Boa |

---

## 2. PROBLEMAS ARQUITETURAIS

### 🔴 Críticos

#### P1 — Ausência de Camada de Serviços
**Impacto:** Alto
**Descrição:** Toda lógica de negócio está espalhada entre hooks, páginas e componentes. Não há `src/services/` com abstrações de domínio.

**Exemplo:**
```typescript
// ATUAL: Lógica de cálculo dentro de ItemConfigurator.tsx (componente UI)
const calculatedPerfis = useMemo(() => {
  // 40+ linhas de cálculo de perfis dentro de um Dialog
}, [largura, altura, productPerfis]);

// DEVERIA: Estar em src/services/esquadria.service.ts
const perfis = EsquadriaService.calcularPerfis(modelo, largura, altura);
```

#### P2 — Componentes Monolíticos
**Impacto:** Alto

| Arquivo | Linhas | Problema |
|---------|--------|---------|
| `src/pages/Orcamentos.tsx` | 506 | 10+ useState, 8 handlers, lógica + UI misturados |
| `src/pages/ConfiguracaoModelos.tsx` | 471 | Config 3D + DB + UI juntos |
| `src/pages/Servicos.tsx` | 423 | KPIs + workflow + CRUD |
| `src/pages/Relatorios.tsx` | 323 | 6 gráficos + lógica |
| `src/components/orcamentos/ItemConfigurator.tsx` | 300+ | Cálculo + UI |
| `src/components/AppSidebar.tsx` | 285 | Config inline + lógica de features |

#### P3 — Hook Genérico Sem Type Safety
**Impacto:** Alto
**Arquivo:** `src/hooks/useSupabaseQuery.ts`

```typescript
// ATUAL: Tipagem fraca, sem validação
function useSupabaseQuery<T = any>(table: TableName) { ... }

// DEVERIA: Hooks específicos com validação Zod
function useOrcamentos(): UseQueryResult<Orcamento[]>
function useClientes(): UseQueryResult<Cliente[]>
```

### 🟠 Moderados

#### P4 — Duplicação de Padrão CRUD
Páginas de Clientes, Fornecedores, Funcionários, Produtos e Administradores têm estrutura quase idêntica sem abstração.

#### P5 — Ausência de Repositórios (Data Access Layer)
Queries Supabase diretamente em hooks sem abstração de acesso a dados.

#### P6 — Handlers Inline em Render
Funções de handling definidas dentro do JSX em vez de fora do componente.

### 🟡 Leves

- Enums de status duplicados (cores/labels) em vários componentes
- `catch (e: any)` sem logging centralizado
- Config de navegação embutida no componente AppSidebar
- Sem testes unitários para lógica de negócio

---

## 3. PONTOS FORTES

- ✅ TypeScript em todo o projeto
- ✅ Alias `@/` para imports absolutos (consistente)
- ✅ React Query para cache e sync
- ✅ shadcn/ui como design system (70+ componentes)
- ✅ Supabase bem configurado (30 tabelas, RLS, triggers)
- ✅ Algoritmo FFD já implementado para plano de corte
- ✅ Motor de cálculo de esquadrias em `src/lib/calculo-esquadria.ts`
- ✅ Sistema de planos/feature gates funcional
- ✅ 3D viewer com React-Three-Fiber
- ✅ PDF export implementado

---

## 4. SCHEMA DO BANCO (Atual)

### Tabelas Existentes

```
auth.users                 → Supabase Auth (managed)
public.profiles            → user_id, nome, email, telefone, cargo
public.user_roles          → user_id, role (admin|gerente|funcionario)
public.clientes            → CRM de clientes
public.fornecedores        → Fornecedores
public.produtos            → Catálogo (tipos de esquadrias)
public.perfis_aluminio     → Perfis por produto
public.orcamentos          → Cabeçalho de orçamentos
public.orcamento_itens     → Itens dos orçamentos
public.pedidos             → Pedidos
public.pedido_itens        → Itens dos pedidos
public.planos_de_corte     → Planos de corte salvos
public.servicos            → Ordens de serviço
public.servico_checklist   → Checklist de materiais
public.contas_receber      → Financeiro A/R
public.contas_pagar        → Financeiro A/P
public.pagamentos          → Registro de pagamentos
public.notas_fiscais       → NF-e, NFS-e, NFC-e
public.contratos           → Contratos com clientes
public.documentos          → Documentos gerais
public.workflow_templates  → Templates de workflow
public.order_progress      → Progresso por etapa
public.config_precos       → Configuração de preços
public.agenda_eventos      → Agenda
```

### Gaps Identificados (Para ETAPA 4)

| Tabela Faltante | Motivo |
|-----------------|--------|
| `companies` | Multitenancy SaaS — isolamento por empresa |
| `window_models` | Modelos de esquadrias com fórmulas de corte |
| `window_parts` | Peças de cada modelo (qual perfil, quantidade, fórmula) |
| `materials_list` | Lista de materiais de um orçamento gerado automaticamente |
| `production_orders` | Ordem de produção com rastreamento |
| `glass_types` | Tipos de vidro com dimensões e preços |
| `hardware` | Ferragens específicas com SKU |
| `accessories` | Acessórios com SKU e preço |
| `cutting_plan_items` | Itens detalhados do plano de corte (hoje em JSON) |

---

## 5. PLANO DE REFATORAÇÃO PRIORIZADO

### Prioridade 1 — Fundação (Semana 1-2)

| Story | Descrição | Impacto |
|-------|-----------|---------|
| REFAT-1.1 | Criar estrutura de diretórios modular | Alto |
| REFAT-1.2 | Criar service layer (5 services principais) | Alto |
| REFAT-1.3 | Criar hooks específicos por entidade | Alto |
| REFAT-1.4 | Extrair lógica de `ItemConfigurator` | Alto |

### Prioridade 2 — Componentização (Semana 2-3)

| Story | Descrição | Impacto |
|-------|-----------|---------|
| REFAT-2.1 | Quebrar Orcamentos.tsx em sub-componentes | Alto |
| REFAT-2.2 | Criar DataTable genérico reutilizável | Médio |
| REFAT-2.3 | Extrair AppSidebar navigation config | Médio |
| REFAT-2.4 | Criar StatusBadge e helpers compartilhados | Médio |

### Prioridade 3 — Banco & Domínio (Semana 3-4)

| Story | Descrição | Impacto |
|-------|-----------|---------|
| REFAT-3.1 | Adicionar tabela `companies` (multitenancy) | Crítico |
| REFAT-3.2 | Criar tabelas `window_models` + `window_parts` | Alto |
| REFAT-3.3 | Criar tabela `production_orders` | Alto |
| REFAT-3.4 | Migrar RLS para isolamento por company | Crítico |

### Prioridade 4 — Motores (Semana 4-5)

| Story | Descrição | Impacto |
|-------|-----------|---------|
| REFAT-4.1 | Refatorar motor de cálculo de esquadria | Alto |
| REFAT-4.2 | Melhorar algoritmo de plano de corte (Best Fit) | Médio |
| REFAT-4.3 | Sistema de orçamento automático por módulo | Alto |
| REFAT-4.4 | Geração de ordem de produção automática | Alto |

### Prioridade 5 — Qualidade (Semana 5-6)

| Story | Descrição | Impacto |
|-------|-----------|---------|
| REFAT-5.1 | Testes unitários para services | Alto |
| REFAT-5.2 | Error handling centralizado | Médio |
| REFAT-5.3 | Validação RLS robusta | Alto |
| REFAT-5.4 | Documentação técnica | Médio |

---

## 6. ARQUITETURA ALVO

```
src/
├── modules/                    # Módulos de domínio
│   ├── auth/                   # Autenticação
│   ├── customers/              # Clientes
│   ├── projects/               # Projetos
│   ├── windows/                # Esquadrias
│   │   ├── profiles/           # Perfis de alumínio
│   │   ├── glass/              # Vidros
│   │   └── hardware/           # Ferragens
│   ├── cutting/                # Plano de corte
│   ├── pricing/                # Precificação
│   ├── orders/                 # Pedidos
│   └── production/             # Produção
│
├── services/                   # Regras de negócio
│   ├── esquadria.service.ts    # Cálculo de esquadrias
│   ├── pricing.service.ts      # Estratégia de preços
│   ├── orcamento.service.ts    # Geração de orçamentos
│   ├── cutting.service.ts      # Algoritmo de corte
│   └── production.service.ts   # Ordens de produção
│
├── repositories/               # Acesso a dados
│   ├── clientes.repository.ts
│   ├── orcamentos.repository.ts
│   ├── pedidos.repository.ts
│   └── produtos.repository.ts
│
├── hooks/                      # Hooks específicos
│   ├── useClientes.ts
│   ├── useOrcamentos.ts
│   ├── usePedidos.ts
│   └── useEsquadrias.ts
│
├── components/                 # UI reutilizável
│   ├── ui/                     # shadcn/ui (existente)
│   ├── tables/DataTable.tsx    # Tabela genérica
│   ├── status/StatusBadge.tsx  # Badge de status
│   └── shared/                 # Componentes compartilhados
│
├── pages/                      # Páginas (max 200 linhas)
└── utils/                      # Utilitários
```

---

*Gerado por Orion (aios-master) — 2026-03-15*
