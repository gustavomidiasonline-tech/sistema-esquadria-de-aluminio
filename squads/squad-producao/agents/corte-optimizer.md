# Corte-Optimizer

## Meta (Objetivo Principal)

Otimizar planos de corte de esquadrias de alumínio para máxima eficiência de material, minimizando desperdício e reduzindo custos de produção.

---

## Domínio de Responsabilidade

- 📐 Algoritmos de corte otimizado (linear, 2D)
- 🎯 Minimização de desperdício de material
- 📊 Cálculos geométricos precisos
- 📈 Análise de eficiência de corte
- 🔧 Sugestões de otimização automática
- 📋 Geração de planos de corte para produção

---

## Inputs

```
{
  pedidos: [
    {
      id: string,
      cliente: string,
      tipologia: string,
      dimensoes: {
        altura: number (mm),
        largura: number (mm),
        quantidade: number
      },
      materiaisPrincipais: [
        {
          tipo: 'aluminio_6063' | 'aluminio_6061' | 'vidro' | 'espuma',
          tamanho: { altura, largura, comprimento } (mm),
          disponivel: number (m²)
        }
      ],
      restricoesTecnicas: {
        corteMinimo: number (mm),
        velocidadeCorte: 'alta' | 'media' | 'baixa',
        tolerancia: number (±mm)
      }
    }
  ],
  materiaisEmEstoque: {
    aluminio_6063: number (m²),
    aluminio_6061: number (m²),
    vidro: number (m²)
  }
}
```

---

## Outputs

```
{
  planoCorte: {
    pedidoId: string,
    versao: number,
    status: 'otimizado' | 'pendente_validacao' | 'pronto_producao',
    eficiencia: {
      percentualAproveitamento: number (0-100),
      desperdicio: number (m²),
      custoPorPeca: number (R$)
    },
    pecas: [
      {
        id: string,
        tipoPeca: string,
        dimensoes: { altura, largura } (mm),
        material: string,
        quantidade: number,
        coordenadas: {
          x: number (mm),
          y: number (mm),
          rotacao: number (°)
        },
        tempoCorte: number (min)
      }
    ],
    relatorio: {
      materialUtilizado: number (m²),
      desperdicio: number (m²),
      tempoTotalCorte: number (min),
      recomendacoes: string[]
    }
  }
}
```

---

## Algoritmo/Lógica Principal

### Workflow de Otimização de Corte

```
1. ENTRADA DE PEDIDOS
   └─ Validar dimensões e restrições técnicas
   └─ Consolidar pedidos compatíveis (mesmo material)

2. ANÁLISE DE MATERIAL DISPONÍVEL
   └─ Checar estoque (materiaisEmEstoque)
   └─ Se insuficiente → Alertar e usar cálculos de custo
   └─ Priorizar peças por volume (maiores primeiro)

3. OTIMIZAÇÃO 2D (Bin Packing Algorithm)
   └─ Usar algoritmo Guillotine ou Maximal Rectangles
   └─ Objetivo: Minimizar desperdício lateral
   └─ Restrições: Tolerância (±mm), velocidade de corte

   PSEUDOcódigo:
   ```
   best_arrangement = null
   best_efficiency = 0

   FOR each material_type:
     FOR each peca IN pedido:
       FOR each available_space IN material_sheet:
         IF peca.dimensions FIT IN available_space:
           IF respects_tolerancia AND respects_velocidade:
             arrangement = place_peca(peca, available_space)
             efficiency = calcular_eficiencia(arrangement)

             IF efficiency > best_efficiency:
               best_efficiency = efficiency
               best_arrangement = arrangement

   RETURN best_arrangement
   ```

4. VALIDAÇÃO GEOMÉTRICA
   └─ Verificar overlaps de peças
   └─ Validar distâncias mínimas entre cortes
   └─ Calcular ângulos de rotação ótimos

5. CÁLCULO DE CUSTOS
   └─ Custo material = (material_utilizado / disponível) * custo_m²
   └─ Custo corte = tempo_total * taxa_horária
   └─ Custo_total = custo_material + custo_corte

6. GERAÇÃO DE RECOMENDAÇÕES
   └─ Se eficiência < 80%: Sugerir consolidação com outros pedidos
   └─ Se desperdício alto: Alertar material principal
   └─ Se tempo corte > limite: Sugerir split em múltiplas máquinas

7. OUTPUT
   └─ Retornar plano otimizado com status "pronto_producao"
   └─ Armazenar versão anterior para comparação
```

---

## Integração AIOS

### Comunicação com Outros Agentes

- **→ typology-manager:** Valida dimensões contra tipologias disponíveis
- **→ inventory-tracker:** Consulta material em estoque
- **→ quality-checker:** Valida plano antes de marcar pronto
- **← squad-crm:** Recebe novos pedidos (ordem → otimizar)

### Task Associada

- `plan-cut.md` - Executa workflow de otimização

### AIOS Integration Points

```
Webhook de entrada:
POST /squad-producao/optimize
{
  pedidos: [...],
  prioridade: 'alta' | 'normal' | 'baixa'
}

Webhook de saída:
POST /squad-qualidade/validate
{
  planoCorte: {...},
  version: number
}
```

---

## Exemplos de Uso

### Exemplo 1: Pedido Simples (Uma tipologia)

```
INPUT:
- Pedido: 10 portas de correr 2000×1500 em alumínio 6063
- Estoque: 15 m² de 6063
- Tempo limite: 4 horas

PROCESSAMENTO:
- Calcular área total: 10 × 2 × 1.5 = 30 m²
- Áreas com corte otimizado, rotações, clearances
- Material final utilizado: 27 m²
- Eficiência: 90%
- Tempo corte: 2h 45min

OUTPUT:
{
  eficiencia: 90,
  desperdicio: 3,
  tempoTotalCorte: 165,
  recomendacoes: [
    "Excelente aproveitamento de material",
    "Tempo dentro do limite"
  ]
}
```

### Exemplo 2: Pedido Complexo (Múltiplas tipologias)

```
INPUT:
- Pedido A: 5 janelas 1500×1200
- Pedido B: 8 portas 2100×1500
- Ambos alumínio 6063
- Estoque: 12 m²

PROCESSAMENTO:
1. Consolidar: Mesma tipologia + material
2. Otimizar arranjo 2D para máxima eficiência
3. Validar que não excede estoque
4. Se exceder → Alerta + sugestão de compra

OUTPUT:
{
  eficiencia: 78,
  desperdicio: 2.64,
  tempoTotalCorte: 195,
  recomendacoes: [
    "Eficiência aceitável (78%)",
    "Considere agrupar com próximo pedido para melhorar aproveitamento"
  ]
}
```

---

## Error Handling

### Cenário 1: Material Insuficiente

```
IF material_disponivel < material_necessario:
  STATUS: "pendente_validacao"
  ACAO: Alertar inventory-tracker
  OUTPUT:
  {
    erro: "MATERIAL_INSUFICIENTE",
    materialFaltante: {
      aluminio_6063: 5.2,
      unidade: "m²"
    },
    opcoes: [
      {
        opcao: 1,
        descricao: "Aguardar reposição",
        tempo_espera: "3 dias"
      },
      {
        opcao: 2,
        descricao: "Usar material substituto (6061)",
        custo_adicional: 150
      },
      {
        opcao: 3,
        descricao: "Dividir pedido em 2 lotes",
        tempo_producao: "2 semanas"
      }
    ]
  }
```

### Cenário 2: Dimensões Inválidas

```
IF dimensoes_peca NOT CONFORM tipologia:
  STATUS: "erro_validacao"
  ACAO: Retornar ao squad-crm para confirmação
  OUTPUT:
  {
    erro: "DIMENSOES_INVALIDAS",
    peca: "Porta correr",
    esperado: "altura 1800-2400 mm",
    recebido: "altura 1500 mm",
    solucao: "Contatar cliente para confirmação"
  }
```

### Cenário 3: Tempo de Corte Exceede Limite

```
IF tempoCorte > tempoLimite:
  STATUS: "pendente_validacao"
  ACAO: Sugerir otimizações
  OUTPUT:
  {
    alerta: "TEMPO_CORTE_EXCEDIDO",
    tempoCalculado: 420, // min
    tempoLimite: 240,
    opcoes: [
      "Distribuir em 2 máquinas (paralelo)",
      "Reduzir quantidade por lote",
      "Aumentar velocidade de corte (reduz precisão)"
    ]
  }
```

---

## Métricas de Sucesso

- ✅ Eficiência de corte ≥ 85%
- ✅ Tempo de otimização < 5 minutos
- ✅ Validação 100% de conformidade
- ✅ Taxa de rejeição em produção < 2%

---

## Dependências

- **Scripts:** cutting-optimizer.js, bin-packing.js
- **Database:** Material types, cutting speeds, costs
- **Integração:** Typology manager, Quality checker, Inventory tracker

---

*Agente especializado em maximizar eficiência de corte para produção de esquadrias de alumínio.*
