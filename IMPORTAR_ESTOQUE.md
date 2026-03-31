# 📥 IMPORTAR 200 ITENS DE ESTOQUE

## ⚠️ Situação atual

Os 200 itens estão no CSV, mas precisam ser importados para o banco com `company_id` correto.

## ✅ Solução (3 opções)

### **Opção 1: Via Interface (Recomendada)** ⭐

1. **Vá para:** Menu → Estoque > Importar Itens
2. **Upload do CSV:** `estoque_200_itens_completo.csv`
3. **Pronto!** O sistema automaticamente:
   - Detecta seu `company_id`
   - Importa os 200 itens
   - Sincroniza com o configurador

**Vantagem:** Funciona 100%, respeita RLS e company_id correto

---

### **Opção 2: Via Script (Para devs)**

Se quiser importar via Node:

```bash
# 1. Faça login no Supabase
npx supabase login

# 2. Pega seu session token (após autenticado na app)
# Copie do localStorage: localStorage.getItem('sb-...access_token')

# 3. Crie um script com o token:
node import-estoque-com-auth.mjs
```

---

### **Opção 3: Via SQL Admin (Se tiver acesso)**

```sql
-- Somente se tiver acesso ao Supabase como ADMIN
INSERT INTO inventory_items (codigo, nome, tipo, quantidade_disponivel, ...company_id)
SELECT ..., '12345678-1234-1234-1234-123456789012'  -- SEU COMPANY ID
FROM (VALUES (...)) AS t(...)
```

---

## 🚀 PRÓXIMAS AÇÕES

**Agora você tem 2 caminhos:**

### **Caminho A: Mais Rápido** (5 min)
1. Abra a app no navegador
2. Menu > Estoque > Importar Itens
3. Clique e selecione `estoque_200_itens_completo.csv`
4. ✅ **PRONTO!** Os 200 itens estão no banco

### **Caminho B: Automatizado** (se já tem dados)
Se você já conseguiu importar de outro jeito:
1. Abra **Config. Modelos**
2. **Novo Modelo** > Selecione os perfis do dropdown
3. ✅ Dropdown vai funcionar!

---

## 📝 Checklist

- [ ] CSV `estoque_200_itens_completo.csv` ✅ (você tem)
- [ ] Abrir a app no navegador
- [ ] Ir para Estoque > Importar Itens
- [ ] Upload do CSV
- [ ] Verificar em Estoque se mostra 200 itens
- [ ] Ir para Config. Modelos > Novo Modelo
- [ ] Tentar adicionar regra → Dropdown deve ter perfis!

---

## ❌ Se ainda não funcionar

Me mande:
1. Screenshot do erro
2. Qual browser você usa
3. Se conseguiu ver os 200 itens em algum momento

---

*Vamos resolver em 5 minutos!* 👑
