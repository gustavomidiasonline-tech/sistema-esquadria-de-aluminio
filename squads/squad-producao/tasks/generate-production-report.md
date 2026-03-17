---
task: Gerar Relatório de Produção
responsavel: "@squad-producao"
type: task-first
---

# generate-production-report

Consolida plano de corte e validações em relatório executivo para equipe de produção.

## Propósito

Fornecer relatório completo e estruturado para máquinas de corte, equipes de montagem e gestão de produção.

## Entrada

```yaml
producao_data:
  plano_corte_id: "PLAN-2024-0001"
  validacoes: {...}
  tipologia_info: {...}
  cliente_info:
    nome: "Cliente A"
    pedido_id: "PED-2024-0001"
    prazo_entrega: "2024-03-25"

  parametros_relatorio:
    incluir_imagens: true
    formato: "pdf" | "html" | "json"
    para_departamento: "producao" | "qualidade" | "financeiro"
```

## Saída

```yaml
relatorio:
  id: "REL-2024-0001"
  data_geracao: "2024-03-17T10:45:00Z"
  versao_plano: 1

  secao_executiva:
    resumo:
      pedido_id: "PED-2024-0001"
      cliente: "Cliente A"
      quantidade_pecas: 15
      material_total: 11.2 m²
      eficiencia_corte: 88%
      tempo_producao: 45 min
      praco_producao: R$ 2.175,00
    cronograma:
      data_inicio: "2024-03-18"
      data_conclusao: "2024-03-19"
      dias_uteis: 2

  secao_tecnica:
    tipologia: "Porta Correr 2 folhas"
    especificacoes:
      dimensoes: "2100 x 1500 mm"
      material: "Alumínio 6063"
      vidro: "Temperado 6mm"
      acabamento: "Anodizado Prata"

    parametros_corte:
      velocidade_corte: "médio"
      profundidade_corte: 3
      tolerancia: ±2 mm
      tempo_medio_peca: 3 min

    instrucoes_producao:
      - "Carregar perfis de alumínio 6063"
      - "Configurar velocidade média no controlador"
      - "Alimentar plano no software de corte"
      - "Monitorar primeiras 5 peças"

  secao_qualidade:
    validacoes_executadas:
      - check: "Conformidade dimensional"
        resultado: "✓ PASSOU"
        evidencia: "Tolerância ±2mm validada"
      - check: "Compatibilidade tipologia"
        resultado: "✓ PASSOU"
      - check: "Material disponível"
        resultado: "✓ PASSOU (12m² em estoque)"

    criterios_aceitacao:
      - "Dimensões dentro de ±2mm"
      - "Sem rebarbas ou danos"
      - "Acabamento sem riscos"
      - "Numeração e marcação corretas"

    pontos_criticos:
      - "Monitorar dimensão altura (2100mm) - tolerância apertada"
      - "Vidro temperado - não pode reutilizar peças rejeitadas"
      - "Acabamento anodizado - proteger durante corte"

  secao_logistica:
    material_necessario:
      - item: "Alumínio 6063"
        quantidade: 12
        unidade: "m²"
        estoque_disponivel: 12
        status: "✓ DISPONÍVEL"
      - item: "Vidro temperado 6mm"
        quantidade: 5
        unidade: "unidades"
        estoque_disponivel: 8
        status: "✓ DISPONÍVEL"

    recursos_necessarios:
      maquinas:
        - tipo: "Serra de corte CNC"
          tempo_producao: 45
          disponibilidade: "Turno 1"
      pessoal:
        - funcao: "Operador de corte"
          horas_necessarias: 2
        - funcao: "Inspetor de qualidade"
          horas_necessarias: 1

  secao_financeira:
    custos:
      material_aluminio: 1.200
      material_vidro: 200
      processamento_corte: 375
      overhead: 200
      total_custos: 1.975

    precificacao:
      preco_venda: 4.200
      margem_bruta: 2.225
      margem_percentual: 53%

  secao_rastreamento:
    id_producao: "PROD-2024-0001"
    numero_serie_inicio: "SER-2024-0001"
    numero_serie_fim: "SER-2024-0015"
    rastreamento_qr_code: "..." # Base64 encoded

  observacoes:
    - "Material em estoque - pronto para começar"
    - "Prazo confortável (2 dias úteis)"
    - "Nenhuma restrição técnica"
    - "Recomendação: Executar no turno 1 para QA disponível"

  proximos_passos:
    1: "Imprimir e distribuir relatório"
    2: "Carregar plano de corte em CNC"
    3: "Executar teste com primeira peça"
    4: "Monitorar qualidade durante produção"
    5: "Inspecionar 100% das peças"
    6: "Marcar com número de série"
    7: "Empacotar conforme especificação"
```

## Checklist

- [ ] **Consolidar Dados**
  - Plano de corte completo
  - Validações de tipologia
  - Informações de cliente
  - Dados de material e estoque

- [ ] **Gerar Seção Executiva**
  - Resumo executivo (1 página)
  - Cronograma realista
  - KPIs principais

- [ ] **Gerar Seção Técnica**
  - Especificações detalhadas
  - Parâmetros de máquina
  - Instruções passo-a-passo
  - Diagrama visual de corte

- [ ] **Gerar Seção Qualidade**
  - Validações executadas
  - Critérios de aceitação
  - Pontos críticos
  - Checks de inspeção

- [ ] **Gerar Seção Logística**
  - Material necessário
  - Disponibilidade confirmada
  - Recursos (máquinas, pessoal)
  - Cronograma de disponibilidade

- [ ] **Gerar Seção Financeira**
  - Detalhamento de custos
  - Precificação
  - Margem de lucro
  - Análise de viabilidade

- [ ] **Gerar Seção Rastreamento**
  - IDs únicos de série
  - QR codes para rastreamento
  - Código de lote

- [ ] **Validar Relatório Completo**
  - Todos os dados presentes
  - Formatação consistente
  - Links e referências corretos
  - Sem erros de digitação

- [ ] **Exportar Relatório**
  - Exportar em formato solicitado (PDF/HTML/JSON)
  - Gerar cópias para cada departamento
  - Arquivar versão final

- [ ] **Distribuir e Registrar**
  - Enviarpara produção
  - Registrar distribuição em log
  - Confirmar recebimento

## Subtarefas

### 1. Coleta de Dados (3 min)

Reunir todas informações necessárias:
- Plano de corte (plan-cut.md)
- Validações (optimize-typology.md)
- Infos cliente (squad-crm)
- Estoque (squad-estoque)

### 2. Geração Automática (10 min)

Usar templates para gerar seções:
- Template executiva
- Template técnica
- Template qualidade
- Template logística
- Template financeira

### 3. Validação Cruzada (5 min)

Conferir consistência:
- Quantidades match
- Datas realistas
- Custos corretos
- Sem conflitos

### 4. Formatação (5 min)

Aplicar estilo visual:
- Logos e headers
- Cores padrão
- Paginação
- Numeração de seções

### 5. Exportação (3 min)

Gerar arquivo final:
- PDF com assinatura
- HTML interativo
- JSON estruturado

## Templates Disponíveis

| Template | Descrição |
|----------|-----------|
| `rel-executiva.html` | Resumo executivo |
| `rel-tecnica.md` | Detalhes técnicos |
| `rel-qualidade.checklist` | Checklist QA |
| `rel-logistica.table` | Recursos e cronograma |
| `rel-financeira.csv` | Análise de custos |

## Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Tempo geração | < 10 min |
| Completude | 100% dos dados |
| Acurácia | 99.9% |
| Taxa erro formatação | 0% |

## Error Handling

**Dados incompletos:**
```yaml
status: "aviso"
mensagem: "Faltam dados de estoque"
acao: "Consultar squad-estoque"
bloqueante: false  # Continua com dados parciais
```

**Cronograma impossível:**
```yaml
status: "erro"
mensagem: "Prazo entrega < tempo produção"
acao: "Requerer prazo estendido com cliente"
bloqueante: true  # Parar até resolução
```

## Workflow

```
Entrada → Validar Dados
        → Gerar Seção Executiva
        → Gerar Seção Técnica
        → Gerar Seção Qualidade
        → Gerar Seção Logística
        → Gerar Seção Financeira
        → Gerar Rastreamento
        → Validar Completude
        → Exportar Formato
        → Distribuir
        → Output Final
```

## Integração

- **← plan-cut:** Dados de plano
- **← optimize-typology:** Validações
- **← squad-estoque:** Disponibilidade
- **← squad-financeiro:** Custos
- **→ squad-qualidade:** Para inspeção
- **→ dashboard:** Monitora status

## Exemplo PDF Output

```
┌─────────────────────────────┐
│  RELATÓRIO DE PRODUÇÃO      │
│  PED-2024-0001              │
│  Cliente A                  │
└─────────────────────────────┘

RESUMO EXECUTIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quantidade: 15 peças
Material: Alumínio 6063
Tempo: 45 minutos
Custo: R$ 1.975
Margem: 53%
Status: ✓ PRONTO PRODUÇÃO

[Diagrama de Corte]

INSTRUÇÕES TÉCNICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Carregar material...
2. Configurar máquina...
3. Monitorar...

[Checklist QA]
```

---

*Task: Relatório executivo para produção eficiente e rastreada*
