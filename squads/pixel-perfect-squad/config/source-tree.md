# Source Tree — pixel-perfect-pixels

## Estrutura Alvo (Pós-Refatoração)

```
src/
├── modules/                        # Módulos de domínio (feature-first)
│   ├── auth/
│   ├── clientes/
│   ├── orcamentos/
│   │   ├── components/             # OrcamentoForm, OrcamentoTable, ItemConfigurator
│   │   ├── hooks/                  # useOrcamentos, useOrcamentoForm
│   │   └── types/                  # OrcamentoFormData, OrcamentoStatus
│   ├── pedidos/
│   ├── servicos/
│   ├── esquadrias/
│   │   ├── components/             # EsquadriaViewer3D, EsquadriaForm
│   │   ├── hooks/                  # useEsquadrias, useModeloConfig
│   │   └── types/                  # EsquadriaModel, PerfilAluminio
│   ├── plano-de-corte/
│   │   ├── components/
│   │   └── hooks/
│   ├── financeiro/
│   │   ├── contas-receber/
│   │   ├── contas-pagar/
│   │   └── notas-fiscais/
│   └── producao/
│
├── services/                       # Regras de negócio (já existente)
│   ├── esquadria.service.ts        # ✅ Existe
│   ├── pricing.service.ts          # ✅ Existe
│   ├── orcamento.service.ts        # ✅ Existe
│   ├── cutting.service.ts          # ✅ Existe
│   ├── production.service.ts       # ✅ Existe
│   └── index.ts
│
├── repositories/                   # Data Access Layer (já existente)
│   ├── clientes.repository.ts      # ✅ Existe
│   ├── orcamentos.repository.ts    # ✅ Existe
│   ├── pedidos.repository.ts       # ✅ Existe
│   ├── produtos.repository.ts      # ✅ Existe
│   ├── window-models.repository.ts # ❌ Falta (REFAT-3.2)
│   └── index.ts
│
├── hooks/                          # Hooks específicos por entidade
│   ├── useClientes.ts
│   ├── useOrcamentos.ts
│   ├── usePedidos.ts
│   ├── useEsquadrias.ts
│   └── useWindowModels.ts
│
├── components/                     # UI compartilhada
│   ├── ui/                         # ✅ shadcn/ui (não modificar)
│   ├── tables/
│   │   └── DataTable.tsx           # ❌ Falta (REFAT-2.2)
│   ├── status/
│   │   └── StatusBadge.tsx         # ❌ Falta (REFAT-2.4)
│   └── shared/
│
├── pages/                          # Páginas (max 200 linhas cada)
│   ├── Orcamentos.tsx              # 🔴 506 linhas → refatorar (REFAT-2.1)
│   ├── ConfiguracaoModelos.tsx     # 🔴 471 linhas → refatorar
│   ├── Servicos.tsx                # 🔴 423 linhas → refatorar
│   └── ...
│
├── lib/
│   ├── calculo-esquadria.ts        # ✅ Motor de cálculo
│   └── supabase.ts                 # ✅ Cliente Supabase
│
└── types/                          # Tipos globais compartilhados
    ├── database.ts                 # Tipos gerados do Supabase
    └── domain.ts                   # Tipos de domínio
```

## Tabelas Supabase (Estado Atual vs Alvo)

| Tabela | Status |
|--------|--------|
| auth.users, profiles, user_roles | ✅ Existe |
| clientes, fornecedores, produtos | ✅ Existe |
| orcamentos, orcamento_itens | ✅ Existe |
| pedidos, pedido_itens | ✅ Existe |
| servicos, servico_checklist | ✅ Existe |
| planos_de_corte | ✅ Existe |
| financeiro (5 tabelas) | ✅ Existe |
| workflow_templates, order_progress | ✅ Existe |
| agenda_eventos | ✅ Existe |
| **companies** | ❌ Falta (REFAT-3.1 — crítico) |
| **window_models** | ❌ Falta (REFAT-3.2) |
| **window_parts** | ❌ Falta (REFAT-3.2) |
| **production_orders** | ❌ Falta (REFAT-3.3) |
| **glass_types** | ❌ Falta |
| **hardware** | ❌ Falta |
| **accessories** | ❌ Falta |
| **cutting_plan_items** | ❌ Falta |
| **materials_list** | ❌ Falta |
