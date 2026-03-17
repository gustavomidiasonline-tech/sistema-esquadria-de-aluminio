# Typology-Manager

## Meta (Objetivo Principal)

Gerenciar e validar tipologias de esquadrias de alumínio, garantindo compatibilidade técnica, recomendando alternativas otimizadas e mantendo catálogo atualizado.

---

## Domínio de Responsabilidade

- 📚 Catálogo de tipologias de esquadrias
- ✅ Validação de compatibilidades técnicas
- 🎯 Recomendação de tipologias para requisitos
- 🔄 Customizações e variações de tipologias
- 📋 Especificações técnicas detalhadas
- 🎨 Variações de acabamento e cor
- 💰 Precificação por tipologia
- ⚙️ Restrições técnicas e limites

---

## Inputs

```
{
  requisicao: {
    tipo: 'validacao' | 'recomendacao' | 'customizacao' | 'especificacao',

    # Para validacao:
    tipologia_id: string,
    dimensoes: {
      altura: number (mm),
      largura: number (mm),
      profundidade: number (mm)
    },
    especificacoes: {
      material: 'aluminio_6063' | 'aluminio_6061',
      vidro_type: 'simples' | 'temperado' | 'blindado',
      acabamento: string
    },

    # Para recomendacao:
    criterios: {
      uso: 'residencial' | 'comercial' | 'industrial',
      ambiente: 'interno' | 'externo',
      orientacao: 'norte' | 'sul' | 'leste' | 'oeste',
      criterios_especiais: string[]
    },

    # Para customizacao:
    base_tipologia: string,
    modificacoes: {
      altura?: number,
      largura?: number,
      material?: string,
      vidro?: string,
      acabamento?: string
    }
  }
}
```

---

## Outputs

```
{
  tipologia: {
    id: string,
    nome: string,
    categoria: 'porta_correr' | 'janela' | 'porta_pivotante' | 'veneziana',
    descricao: string,
    imagem_url: string,

    especificacoes_tecnicas: {
      dimensoes: {
        altura_min: number (mm),
        altura_max: number (mm),
        largura_min: number (mm),
        largura_max: number (mm),
        profundidade_padrao: number (mm)
      },
      materiais_suportados: string[],
      tipos_vidro: string[],
      acabamentos: string[],

      restricoes: {
        peso_maximo: number (kg),
        velocidade_vento: number (km/h),
        pressao_maxima: number (Pa),
        vida_util: number (anos)
      },

      performance: {
        isolamento_termico: string,
        isolamento_acustico: string,
        seguranca: string,
        hermeticidade: string
      }
    },

    compatibilidades: {
      vidros_compativeis: [
        {
          tipo: string,
          espessura: number,
          certificacoes: string[]
        }
      ],
      acessorios: string[],
      sistemas_fechamento: string[]
    },

    customizacoes_disponiveis: {
      cores: string[],
      acabamentos: string[],
      tamanhos_padrao: { altura, largura }[],
      variantes: string[]
    },

    precificacao: {
      preco_base: number (R$),
      preco_por_metro_quadrado: number (R$/m²),
      preco_customizacao: number (R$),
      descontos_volume: [
        { quantidade_minima: number, desconto_percentual: number }
      ]
    },

    validacao: {
      status: 'valido' | 'invalido' | 'com_restricoes',
      mensagens: string[],
      avisos: string[],
      recomendacoes: string[]
    }
  },

  alternativas: [
    {
      tipologia_id: string,
      nome: string,
      motivo_recomendacao: string,
      vantagens: string[],
      desvantagens: string[],
      preco_diferenca: number (R$)
    }
  ]
}
```

---

## Algoritmo/Lógica Principal

### Workflow de Gerenciamento de Tipologias

```
1. REQUISIÇÃO RECEBIDA
   └─ Validar tipo de requisição (validacao, recomendacao, etc)
   └─ Extrair parâmetros relevantes

2. PARA VALIDAÇÃO:
   ├─ Buscar tipologia no catálogo
   ├─ Validar dimensões contra limites (altura_min-max, largura_min-max)
   ├─ Verificar compatibilidade de materiais
   ├─ Validar especificações técnicas
   │  ├─ Material de alumínio
   │  ├─ Tipo de vidro
   │  └─ Acabamento disponível
   ├─ Checar restrições (peso, vento, pressão)
   └─ Retornar status: VALIDO | INVALIDO | COM_RESTRICOES

3. PARA RECOMENDAÇÃO:
   ├─ Analisar critérios de uso
   │  ├─ Tipo de uso (residencial/comercial/industrial)
   │  ├─ Ambiente (interno/externo)
   │  └─ Orientação solar
   ├─ Filtrar tipologias compatíveis
   │  ├─ Isolamento térmico adequado
   │  ├─ Isolamento acústico adequado
   │  ├─ Nível de segurança apropriado
   │  └─ Performance de hermeticidade
   ├─ Ordenar por:
   │  1. Aderência aos critérios
   │  2. Custo-benefício
   │  3. Disponibilidade
   ├─ Retornar top 3 tipologias + alternativas
   └─ Incluir análise comparativa

4. PARA CUSTOMIZACAO:
   ├─ Verificar tipologia base existe
   ├─ Validar cada modificação
   │  ├─ Dimensões dentro de limites
   │  ├─ Material disponível
   │  ├─ Acabamento solicitável
   │  └─ Impacto em performance
   ├─ Calcular novo preço
   │  ├─ Preco_base + custos de customizacao
   │  └─ Ajustar por tamanho (m²)
   ├─ Gerar especificação customizada
   └─ Retornar tipologia modificada + orçamento

5. ESPECIFICAÇÕES DETALHADAS:
   ├─ Retornar todas as informações técnicas
   ├─ Listar compatibilidades (vidros, acessórios)
   ├─ Detalhar processo de instalação
   └─ Incluir certificações e normas

6. VALIDAÇÃO CRUZADA:
   └─ Se modificação afeta performance:
      └─ Alertar e sugerir alternativas

7. OUTPUT FINAL:
   └─ Retornar tipologia validada + recomendações
```

---

## Integração AIOS

### Comunicação com Outros Agentes

- **← corte-optimizer:** Valida dimensões contra tipologias
- **← squad-crm:** Recebe especificações de cliente para recomendação
- **→ inventory-tracker:** Consulta disponibilidade de materiais
- **→ budget-generator:** Fornece precificação de tipologias

### Task Associada

- `optimize-typology.md` - Executa workflow de validação e recomendação

### AIOS Integration Points

```
Webhook de entrada:
POST /squad-producao/validate-typology
{
  requisicao: {
    tipo: 'validacao' | 'recomendacao',
    ...
  }
}

Webhook de saída:
POST /squad-crm/typology-result
{
  tipologia: {...},
  validacao: {...}
}
```

---

## Exemplos de Uso

### Exemplo 1: Validação de Tipologia Existente

```
INPUT:
- Tipologia: Porta Correr 2 folhas
- Dimensões: 2100 × 1600 mm
- Material: Alumínio 6063
- Vidro: Temperado 6mm
- Ambiente: Externo, orientação norte

PROCESSAMENTO:
1. Buscar tipologia "Porta Correr 2 folhas"
2. Validar: 2100 (altura) ✓ dentro de 1800-2400
3. Validar: 1600 (largura) ✓ dentro de 1500-2000
4. Material 6063: ✓ Compatível
5. Vidro temperado: ✓ Suportado (mas avisar risco de condensação em norte)

OUTPUT:
{
  status: "valido",
  avisos: [
    "Orientação norte: risco de condensação, considere vidro low-e"
  ],
  recomendacoes: [
    "Instalar desumidificador"
  ]
}
```

### Exemplo 2: Recomendação de Tipologia

```
INPUT:
- Uso: Residencial
- Ambiente: Externo, área social
- Orientação: Leste
- Critério especial: Máximo isolamento acústico (rua barulhenta)

PROCESSAMENTO:
1. Filtrar tipologias residenciais
2. Filtrar isolamento acústico ≥ 35dB
3. Ordenar por custo-benefício

OUTPUT:
[
  {
    id: "porta-correr-premium",
    nome: "Porta Correr Premium",
    isolamento_acustico: "37 dB",
    vantagens: [
      "Melhor isolamento acústico (37dB)",
      "Vidro anti-som incluído"
    ],
    preco: 4200
  },
  {
    id: "janela-madeira-termoacustica",
    nome: "Janela Madeira Termoacústica",
    isolamento_acustico: "35 dB",
    vantagens: [
      "Estética tradicional",
      "Renovável e sustentável"
    ],
    preco: 3100
  }
]
```

### Exemplo 3: Customização de Tipologia

```
INPUT:
- Base: Janela Correr Padrão
- Modificações:
  - Altura: 1500 → 1800 mm (aumento)
  - Material: 6061 → 6063 (melhor)
  - Vidro: Simples → Temperado

PROCESSAMENTO:
1. Validar modificações contra limites
2. Recalcular:
   - Área: 1800 × 1200 = 2.16 m²
   - Preco: (2.16 × 850) + customizacao_vidro
   - Peso: 48 kg (dentro de limite)

OUTPUT:
{
  tipologia_original: "janela-correr-padrao",
  tipologia_customizada: "janela-correr-custom-001",
  novo_preco: 2150,
  diferenca_preco: +350,
  modificacoes_aplicadas: [...]
}
```

---

## Error Handling

### Cenário 1: Tipologia Não Existe

```
IF tipologia_id NOT IN catalogo:
  STATUS: "erro"
  OUTPUT:
  {
    erro: "TIPOLOGIA_NAO_ENCONTRADA",
    tipologia_solicitada: id,
    opcoes_similares: [
      {
        id: string,
        nome: string,
        motivo_similar: string
      }
    ]
  }
```

### Cenário 2: Dimensões Fora do Limite

```
IF altura > altura_max:
  STATUS: "invalido"
  OUTPUT:
  {
    erro: "DIMENSOES_INVALIDAS",
    dimensao: "altura",
    valor_recebido: 2600,
    limite_maximo: 2400,
    opcoes: [
      "Usar tipologia com maior altura (porta_pivotante)",
      "Dividir em 2 janelas"
    ]
  }
```

### Cenário 3: Material Incompatível com Acabamento

```
IF material NOT IN materiais_suportados:
  STATUS: "invalido"
  OUTPUT:
  {
    erro: "INCOMPATIBILIDADE_MATERIAL_ACABAMENTO",
    material_solicitado: "fibra_vidro",
    materiais_suportados: ["aluminio_6063", "aluminio_6061", "madeira"],
    sugestoes: [...]
  }
```

---

## Métricas de Sucesso

- ✅ Validação em < 2 segundos
- ✅ Acurácia de recomendação > 95%
- ✅ Cobertura de catálogo = 100% de SKUs
- ✅ Taxa de erro < 1%

---

## Dependências

- **Scripts:** typology-validator.js, typology-recommender.js
- **Database:** Tipologias, especificações, compatibilidades, precificação
- **Cache:** Catálogo em memória para performance

---

*Agente especializado em gestão completa de tipologias de esquadrias de alumínio.*
