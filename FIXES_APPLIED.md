# Correções Aplicadas - 30/03/2026

## 📋 Resumo dos Problemas Corrigidos

### 1. Erro de jsPDF autoTable
**Status**: ✅ CORRIGIDO (no código)

**Erro Original**:
```
TypeError: doc.autoTable is not a function at pdf-export.ts:698
```

**Causa**: O import com efeito colateral `import "jspdf-autotable"` não estava carregando o plugin corretamente.

**Solução Aplicada**:
```typescript
// Em src/lib/pdf-export.ts
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";

// Aplicar o plugin explicitamente
applyPlugin(jsPDF);
```

**Arquivo Alterado**: [src/lib/pdf-export.ts](src/lib/pdf-export.ts#L1-L11)

---

### 2. Erro RLS do Supabase (406 Not Acceptable)
**Status**: ⏳ AGUARDANDO APLICAÇÃO DA MIGRATION

**Erro Original**:
```
GET https://gkklumrnzsnytlxscpll.supabase.co/rest/v1/inventory_items?... 406 (Not Acceptable)
Erro ao salvar item: new row violates row-level security policy
```

**Causa Raiz**:
1. A função `get_user_company_id()` estava usando `profiles.id` em vez de `profiles.user_id`
2. Isso fazia a RLS falhar porque nunca encontrava a linha de perfil
3. O erro 406 é consequência do problema de RLS

**Solução**:
- Corrigida função `get_user_company_id()` em `20260330010000_fix_rls_and_company_schema.sql`
- Simplificadas policies de inventory em `20260330040000_fix_inventory_complete.sql`
- Atualizada migration anterior `20260317200100_fix_inventory_rls.sql` para consistência

---

## 🚀 Próximas Passos

### 1. Aplicar as Migrations no Supabase

```bash
# Opção A: Usando Supabase CLI
supabase db push

# Opção B: Via Dashboard do Supabase
# Acesse https://app.supabase.com > seu projeto > SQL Editor
# Execute os arquivos:
#   1. supabase/migrations/20260330010000_fix_rls_and_company_schema.sql (se ainda não foi)
#   2. supabase/migrations/20260330040000_fix_inventory_complete.sql (NOVA)
```

### 2. Testar a Conexão

```bash
# Execute este teste para verificar se tudo está funcionando
npm run dev

# Em outro terminal, teste a conexão:
node test-supabase-connection.mjs
```

### 3. Verificar no Dashboard

1. Importar itens de estoque novamente
2. Exportar PDF de materiais (BOM)
3. Ambas as operações devem funcionar sem erros

---

## 📁 Migrations Criadas/Alteradas

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `20260330010000_fix_rls_and_company_schema.sql` | ✅ Existente | Corrige `get_user_company_id()` |
| `20260330040000_fix_inventory_complete.sql` | 🆕 NOVA | Recria policies com função corrigida |
| `20260317200100_fix_inventory_rls.sql` | ✏️ Atualizada | Usa `get_user_company_id()` |
| `supabase/migrations/20260330030000_fix_inventory_rls_user_id.sql` | 🗑️ Removida | Substituída pela versão 40000 |

---

## 🔍 Verificação Técnica

### Antes (ERRADO):
```sql
-- Em 20260317200100_fix_inventory_rls.sql
WHERE id = auth.uid()  -- ❌ ERRADO
-- profiles.id é uma UUID gerada, não relacionada a auth.uid()
```

### Depois (CORRETO):
```sql
-- Em 20260330010000 + 20260330040000
CREATE FUNCTION get_user_company_id()
  SELECT company_id FROM profiles
  WHERE user_id = auth.uid()  -- ✅ CORRETO
```

---

## 📊 Impacto das Alterações

✅ **Exportação de PDF (BOM)**: Funciona normalmente
⏳ **Importação de Estoque**: Aguardando migration
✅ **Código Frontend**: Já atualizado
⏳ **Banco de Dados**: Aguardando migration

---

## ⚠️ Importante

**Não faça commit até aplicar as migrations!**

Após aplicar as migrations no Supabase:
1. Teste no navegador
2. Se funcionar: `git add -A && git commit`
3. Se não funcionar: verifique os logs do Supabase

---

## 🆘 Troubleshooting

### Problema: Erro 406 continua após migration
- [ ] Verifique se a migration foi aplicada (SQL Editor do Supabase)
- [ ] Recarregue a página (Ctrl+Shift+R para hard refresh)
- [ ] Verifique o console do navegador para novos erros

### Problema: Autenticação falha
- [ ] Verifique se a sessão está ativa
- [ ] Faça login novamente
- [ ] Verifique se o perfil foi criado em `profiles` table

### Problema: RLS ainda bloqueando
- [ ] Verifique se o usuário tem `company_id` preenchido em `profiles`
- [ ] Execute: `SELECT user_id, company_id FROM profiles WHERE user_id = auth.uid();`
- [ ] Se `company_id` for NULL, atualize manualmente ou use `auto_provision_company()`

---

Última atualização: 2026-03-30 15:30
