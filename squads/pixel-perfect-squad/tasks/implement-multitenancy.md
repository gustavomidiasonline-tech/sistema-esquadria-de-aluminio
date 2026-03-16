---
id: implement-multitenancy
agent: supabase-architect
elicit: false
---

# Task: Implementar Multitenancy (companies + RLS)

## Objetivo
Adicionar isolamento multi-tenant ao sistema via tabela `companies`,
adicionando `company_id` nas tabelas principais e atualizando RLS policies.

## Contexto
O sistema atual funciona com usuário único por deploy. Para SaaS multi-tenant,
cada empresa deve ver apenas seus próprios dados. Esta é a mudança mais crítica
e deve ser feita antes de qualquer nova feature.

## Passos

### PASSO 1 — Criar Migration: companies
```sql
-- supabase/migrations/{timestamp}_create-companies.sql
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address JSONB,
  plan_tier TEXT NOT NULL DEFAULT 'basic'
    CHECK (plan_tier IN ('basic', 'pro', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admin vê todas; usuário vê apenas a sua
CREATE POLICY "company_select" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### PASSO 2 — Adicionar company_id em profiles
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
```

### PASSO 3 — Adicionar company_id nas tabelas principais
Tabelas que precisam de isolamento:
- `clientes`
- `fornecedores`
- `produtos`
- `orcamentos`
- `pedidos`
- `servicos`
- `contas_receber`
- `contas_pagar`
- `agenda_eventos`

Para cada tabela:
```sql
ALTER TABLE public.{tabela}
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE INDEX idx_{tabela}_company_id ON public.{tabela}(company_id);
```

### PASSO 4 — Atualizar RLS Policies
Para cada tabela com company_id, substituir policies existentes por:
```sql
DROP POLICY IF EXISTS "{policy_antiga}" ON public.{tabela};

CREATE POLICY "tenant_isolation_{tabela}" ON public.{tabela}
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
```

### PASSO 5 — Helper Function no Supabase
```sql
-- Facilita verificação de company em todas as policies
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Uso nas policies:
-- USING (company_id = get_user_company_id())
```

### PASSO 6 — Atualizar Repositories no Frontend
Após migration, todos os repositories precisam incluir `company_id` nos inserts:
```typescript
// Automático via hook de contexto
const { companyId } = useCompany(); // Novo hook a criar

// Em todos os creates:
await supabase.from('clientes').insert({
  ...data,
  company_id: companyId,
});
```

### PASSO 7 — Criar useCompany Hook
```typescript
// src/hooks/useCompany.ts
export function useCompany() {
  const { data: profile } = useProfile();
  return {
    companyId: profile?.company_id,
    company: profile?.companies,
  };
}
```

## Validação

- [ ] Migration aplica sem erro (`supabase db push`)
- [ ] RLS policies impedem acesso cross-tenant
- [ ] Dados existentes não foram perdidos
- [ ] Frontend carrega após mudança (ajustar queries que precisem de company_id)
- [ ] Teste manual: criar 2 usuários de companies diferentes e verificar isolamento
