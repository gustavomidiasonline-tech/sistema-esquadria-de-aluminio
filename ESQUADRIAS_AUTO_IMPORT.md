# 🚀 Importação Automática de Modelos de Esquadrias

**100% Automatizado - Sem processos manuais!**

## ✅ O que foi corrigido

1. **Bug de perfis vazios** - O dropdown agora carrega corretamente os 200 itens do estoque
2. **Sincronização de tabelas** - `perfis_catalogo` agora conecta com `cut_rules`
3. **Automação completa** - Serviço para importar modelos em massa via código

---

## 🎯 Como Usar (3 Opções)

### **Opção 1: Interface Manual (Rápida) ✨**

Agora que o bug foi corrigido, você pode:

1. Vá para **Config. Modelos** > **Novo Modelo**
   - Nome: "Janela Correr 2F"
   - Descrição: "Janela alumínio com vidro"

2. Clique em **Novo Modelo**

3. Agora o dropdown vai mostrar os **200 perfis do estoque** ✅

4. Adicione regras de corte:
   ```
   Perfil: AL-001 (Alumínio 40x40)
   Fórmula: L - 40    (Largura menos 40mm)
   Qtd: 2

   Perfil: AL-002 (Alumínio 30x30)
   Fórmula: H - 30    (Altura menos 30mm)
   Qtd: 4
   ```

---

### **Opção 2: Automação via Código (Para Planilhas) 🔧**

```typescript
import { AutoImportEsquadriasService } from '@/services/auto-import-esquadrias.service';

// Importar UM modelo
const modeloConfig = {
  modeloNome: "Janela Correr 2 Folhas",
  modeloDescricao: "Janela de alumínio com vidro temperado",
  componentes: [
    {
      perfilCodigo: "AL-001",  // Do estoque
      formula: "L - 40",
      quantidade: 2,
      posicao: "vertical"
    },
    {
      perfilCodigo: "AL-002",
      formula: "H - 30",
      quantidade: 4,
      posicao: "horizontal"
    }
  ]
};

const modeloId = await AutoImportEsquadriasService.criarModeloCompleto(modeloConfig);
console.log("✅ Modelo criado:", modeloId);
```

---

### **Opção 3: Importação em Massa (Para Múltiplas Planilhas) 📊**

```typescript
const modelos = [
  {
    modeloNome: "Janela Correr 2F",
    componentes: [
      { perfilCodigo: "AL-001", formula: "L - 40", quantidade: 2 },
      { perfilCodigo: "AL-002", formula: "H - 30", quantidade: 4 }
    ]
  },
  {
    modeloNome: "Porta Vidraçada",
    componentes: [
      { perfilCodigo: "AL-003", formula: "L - 50", quantidade: 2 },
      { perfilCodigo: "AL-004", formula: "H - 50", quantidade: 4 }
    ]
  },
  {
    modeloNome: "Esquadria Fixa",
    componentes: [
      { perfilCodigo: "AL-001", formula: "L", quantidade: 4 }
    ]
  }
];

const resultado = await AutoImportEsquadriasService.importarMultiplos(modelos);
console.log(`✅ ${resultado.sucesso} modelos importados`);
if (resultado.erros.length > 0) {
  console.error("⚠️  Erros:", resultado.erros);
}
```

---

## 🧮 Fórmulas de Cálculo

Use variáveis nas fórmulas:

| Variável | Significa | Exemplo |
|----------|-----------|---------|
| `L` | Largura da janela | `L - 40` (largura menos 40mm) |
| `H` | Altura da janela | `H - 30` (altura menos 30mm) |
| `L / 2` | Metade da largura | Para 2 folhas |
| `H + 10` | Altura + margem | Para sobreposição |

---

## 📋 Como Organizar Sua Planilha de Importação

Se você tiver uma planilha Excel com modelos, organize assim:

```
| Modelo | Perfil | Fórmula | Qtd | Posição |
|--------|--------|---------|-----|---------|
| Janela Correr | AL-001 | L - 40 | 2 | vertical |
| Janela Correr | AL-002 | H - 30 | 4 | horizontal |
| Porta 4F | AL-005 | L / 2 | 4 | vertical |
| Porta 4F | AL-006 | H | 8 | horizontal |
```

Depois converta para o formato acima e use `importarMultiplos()`.

---

## 🔄 Sincronização Entre Estruturas

Se você tem modelos na aba **Esquadrias** (ConfiguradorTab) e quer usá-los em **Config. Modelos**:

```typescript
const resultado = await AutoImportEsquadriasService.sincronizarEstruturasEsquadrias();
console.log(resultado.message);
```

---

## ✨ Fluxo Completo (Do Zero ao Uso)

1. **Importe dados** → Menu > Estoque > **Importar Itens**
   - Seus 200 perfis já estão aqui ✅

2. **Crie modelos** → **Config. Modelos** > **Novo Modelo**
   - Agora com dropdown funcionando!

3. **Use no configurador** → **Esquadrias**
   - Selecione o modelo
   - Entre dimensões (1200 x 1000mm)
   - Sistema calcula automaticamente:
     - Lista de corte
     - Peso total
     - Vidro necessário
     - Ferragens

4. **Salve como projeto** → Projeto pronto para fabricação

---

## 🆘 Troubleshooting

**"Perfil não aparece no dropdown?"**
- ✅ Corrigido! Rebuild do projeto e teste novamente

**"Fórmula retorna resultado estranho?"**
- Verifique se usa `L` (maiúscula) e `H` (maiúscula)
- Exemplo certo: `L - 40`
- Exemplo errado: `l - 40`

**"Erro ao importar modelo?"**
- Verifique se o código do perfil (ex: "AL-001") existe no estoque
- Use `supabase > Estoque > Ver Códigos` para confirmar

---

## 📞 Próximos Passos

Você pode agora:
- ✅ Preencher manualmente via interface
- ✅ Importar em massa via código
- ✅ Usar o configurador para gerar listas de corte
- ✅ Exportar para fabricação

**Quer ajuda com algum modelo específico?** Me diz os dados!

---

*Auto-import service criado em 2026-03-30 - Orion 👑*
