# Tech Stack — pixel-perfect-pixels

## Frontend
- **React 18** com TypeScript strict mode
- **Vite** como bundler
- **TailwindCSS** para estilização
- **shadcn/ui** como design system (70+ componentes em `src/components/ui/`)
- **React Query (TanStack Query)** para cache e sincronização de estado servidor
- **React Three Fiber** para visualização 3D de esquadrias
- **Recharts** para gráficos e dashboards

## Backend / Database
- **Supabase** (PostgreSQL managed)
  - Auth via Supabase Auth
  - RLS policies por usuário e por company (multitenancy)
  - Edge Functions para lógica server-side
  - Realtime subscriptions disponíveis
- **30+ tabelas** no schema `public`

## Validação & Tipagem
- **Zod** para validação de schemas (preferir sobre `any`)
- **TypeScript** — sem uso de `any`, usar `unknown` + type guards

## Testes
- **Vitest** como test runner
- **Testing Library** para testes de componentes
- Arquivo de config: `vitest.config.ts`

## Padrões de Import
- Alias `@/` mapeado para `src/` — SEMPRE usar importes absolutos
- Proibido: `import X from '../../../components/...'`
- Correto: `import X from '@/components/...'`

## Algoritmos de Domínio
- `src/lib/calculo-esquadria.ts` — motor de cálculo de perfis e vidros
- `src/services/cutting.service.ts` — algoritmo FFD para plano de corte
- `src/services/esquadria.service.ts` — orquestração de cálculo de esquadrias
