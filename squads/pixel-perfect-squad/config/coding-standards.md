# Padrões de Código — pixel-perfect-pixels

## Regras Gerais

1. **TypeScript strict** — nunca use `any`, use `unknown` com type guards ou tipos específicos
2. **Imports absolutos** com alias `@/` — nunca use imports relativos `../../`
3. **2 espaços** de indentação, **aspas simples**, **ponto-e-vírgula** obrigatório
4. **kebab-case** para nomes de arquivo, **PascalCase** para componentes, **SCREAMING_SNAKE_CASE** para constantes

## Arquitetura de Camadas

```
UI (pages/components)
    ↓ chama
Hooks (useX.ts) — React Query + invalidation
    ↓ chama
Services (x.service.ts) — lógica de negócio pura
    ↓ chama
Repositories (x.repository.ts) — acesso Supabase
    ↓ chama
Supabase Client
```

**Regra crítica:** Lógica de negócio NÃO pode estar em componentes nem em páginas.

## Componentes

- Páginas devem ter **máximo 200 linhas**
- Componentes de UI devem ter **máximo 150 linhas**
- Cada componente em arquivo próprio
- Props sempre tipadas com `interface`

```typescript
interface OrcamentoFormProps {
  onSubmit: (data: OrcamentoFormData) => Promise<void>;
  defaultValues?: Partial<OrcamentoFormData>;
}

export const OrcamentoForm = ({ onSubmit, defaultValues }: OrcamentoFormProps) => {
  // ...
};
```

## Error Handling

```typescript
try {
  const result = await orcamentosRepository.create(data);
  return result;
} catch (error) {
  console.error('Erro ao criar orçamento:', error);
  throw new Error(`Falha ao criar orçamento: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
}
```

## Hooks Específicos por Entidade

```typescript
// CORRETO
export function useOrcamentos(): UseQueryResult<Orcamento[]> { ... }
export function useClientes(): UseQueryResult<Cliente[]> { ... }

// PROIBIDO
function useSupabaseQuery<T = any>(table: TableName) { ... } // genérico demais
```

## Validação com Zod

```typescript
const OrcamentoSchema = z.object({
  cliente_id: z.string().uuid(),
  itens: z.array(OrcamentoItemSchema).min(1),
  desconto: z.number().min(0).max(100).default(0),
});

type OrcamentoFormData = z.infer<typeof OrcamentoSchema>;
```

## Ordem de Imports

1. Bibliotecas core (react, react-dom)
2. Bibliotecas externas (@tanstack/react-query, zod)
3. Componentes UI (@/components/ui/*)
4. Componentes de feature (@/components/*)
5. Hooks (@/hooks/*)
6. Services (@/services/*)
7. Repositories (@/repositories/*)
8. Utilitários e tipos (@/lib/*, @/types/*)
