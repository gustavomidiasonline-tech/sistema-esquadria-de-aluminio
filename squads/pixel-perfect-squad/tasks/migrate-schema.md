---
id: migrate-schema
agent: supabase-architect
elicit: true
---

# Task: Criar Migration Supabase

## Objetivo
Criar e aplicar uma nova migration para adicionar tabelas ou colunas faltantes
identificadas na análise brownfield.

## Inputs (elicit)

1. **Qual tabela criar/alterar?**
   - `companies` (multitenancy — CRÍTICO)
   - `window_models` (modelos de esquadria com fórmulas)
   - `window_parts` (peças de cada modelo)
   - `production_orders` (ordens de produção)
   - `glass_types` (catálogo de vidros)
   - `hardware` (ferragens)
   - `accessories` (acessórios)
   - Outra: ___

2. **Tem dados existentes a preservar?** (sim/não)

## Passos

### PASSO 1 — Gerar arquivo de migration
```bash
# Nomear com timestamp + descrição kebab-case
# Exemplo: supabase/migrations/20260315120000_create-companies.sql
```

### PASSO 2 — Escrever DDL conforme padrão do squad

Obrigatório em TODA migration:
- `CREATE TABLE IF NOT EXISTS` (idempotente)
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Políticas RLS adequadas
- Índices em FKs e colunas de busca
- Trigger `updated_at` se a tabela tiver esse campo
- Comentário rollback no final

### PASSO 3 — Aplicar migration
```bash
# Verificar status atual
supabase migration list

# Aplicar
supabase db push

# Verificar se aplicou
supabase migration list
```

### PASSO 4 — Atualizar types TypeScript
Após migration, regenerar tipos:
```bash
# Se usando supabase CLI com gen types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### PASSO 5 — Criar/Atualizar Repository
Se nova tabela, criar repository correspondente em `src/repositories/`.

## Templates de Tabelas Faltantes

### window_models
```sql
CREATE TABLE IF NOT EXISTS public.window_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,                    -- "Janela de Correr 2 Folhas"
  category TEXT NOT NULL,               -- sliding, casement, fixed, box
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  min_width_mm INTEGER DEFAULT 400,
  max_width_mm INTEGER DEFAULT 4000,
  min_height_mm INTEGER DEFAULT 400,
  max_height_mm INTEGER DEFAULT 3000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### window_parts
```sql
CREATE TABLE IF NOT EXISTS public.window_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES public.window_models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Trilho Superior"
  part_type TEXT NOT NULL,              -- profile, glass, hardware, accessory
  profile_id UUID REFERENCES public.perfis_aluminio(id),
  quantity_formula TEXT NOT NULL,       -- "2" ou "largura / 2 - 10"
  length_formula TEXT,                  -- "largura - 40" (para perfis)
  area_formula TEXT,                    -- "(largura-X) * (altura-Y)" (para vidros)
  sort_order INTEGER DEFAULT 0
);
```

### production_orders
```sql
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cutting', 'assembly', 'glass', 'finishing', 'quality', 'delivered')),
  priority INTEGER DEFAULT 5,
  due_date DATE,
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(user_id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Validação

- [ ] `supabase db push` retorna sucesso
- [ ] `supabase migration list` mostra migration como aplicada
- [ ] RLS ativa na nova tabela
- [ ] TypeScript types regenerados sem erros
- [ ] Repository criado (se nova tabela)
