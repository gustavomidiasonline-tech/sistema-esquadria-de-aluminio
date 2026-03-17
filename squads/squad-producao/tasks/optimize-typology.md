---
task: Validar e Otimizar Tipologia
responsavel: "@squad-producao"
agent: typology-manager
type: task-first
---

# optimize-typology

Valida tipologia solicitada contra especificações técnicas e recomenda otimizações para máxima performance.

## Propósito

Garantir que tipologia escolhida atende requisitos técnicos, restrições de projeto e oferece melhor custo-benefício.

## Entrada

```yaml
tipologia_validacao:
  tipologia_id: "porta-correr-premium"
  dimensoes:
    altura: 2100
    largura: 1500
  material: "aluminio_6063"
  ambiente: "externo"
  orientacao: "norte"
  criterios_especiais:
    - isolamento_acustico_minimo: 35
    - isolamento_termico_minimo: 1.8
    - seguranca: "alta"
```

## Saída

```yaml
validacao_resultado:
  tipologia_id: "porta-correr-premium"
  status: "valido_com_restricoes"
  conformidade: 95

  especificacoes_tecnicas:
    dimensoes:
      altura_permitida: "1800-2400"
      largura_permitida: "1500-2000"
    isolamento:
      termico: 1.9
      acustico: 37
    performance:
      resistencia_vento: "Classe C5"
      hermeticidade: "Classe 3"

  validacoes:
    - check: "Dimensões em limite"
      resultado: "✓ PASSOU"
    - check: "Material compatível"
      resultado: "✓ PASSOU"
    - check: "Isolamento acústico"
      resultado: "✓ PASSOU (37 > 35)"

  avisos:
    - "Orientação norte: risco de condensação"
    - "Considere vidro low-e para ganho térmico"

  alternativas:
    - id: "janela-dupla-termoacustica"
      razao: "Melhor isolamento acústico (40dB)"
      vantagem_preco: -300

  recomendacoes:
    - "Instalar sistema de desumidificação"
    - "Optar por vidro low-e para norte"
    - "Usar bucha de selagem reforçada"

  custo_impacto:
    preco_base: 4200
    customizacoes: 350
    preco_final: 4550
```

## Checklist

- [ ] **Validar Tipologia Existe**
  - Buscar ID no catálogo
  - Se não existe: Retornar sugestões de similares
  - Se existe: Prosseguir

- [ ] **Validar Dimensões**
  - Altura dentro de [altura_min, altura_max]
  - Largura dentro de [largura_min, largura_max]
  - Se fora: Alertar + sugerir tipologia alternativa

- [ ] **Validar Especificações**
  - Material em lista de compatíveis
  - Vidro em tipos suportados
  - Acabamento disponível

- [ ] **Validar Ambiente**
  - Tipologia apropriada para externo/interno
  - Resistência a condições climáticas
  - Durabilidade adequada para uso

- [ ] **Validar Orientação**
  - Se norte: Avisar risco condensação
  - Se sul: Avisar ganho de calor
  - Sugerir vidro adequado

- [ ] **Validar Performance**
  - Isolamento térmico ≥ requisito
  - Isolamento acústico ≥ requisito
  - Segurança ≥ requisito
  - Hermeticidade ≥ requisito

- [ ] **Recomendações de Otimização**
  - Se performance marginal: Sugerir upgrade
  - Se isolamento baixo: Recomend ar vidro especial
  - Se custo alto: Oferecer alternativas

- [ ] **Calcular Impacto de Custos**
  - Preco_base da tipologia
  - Customizações solicitadas
  - Preco_final

- [ ] **Gerar Alternativas**
  - Se tipologia não atende 100%: Oferecer 2-3 alternativas
  - Comparar preço e performance
  - Justificar recomendação

- [ ] **Output Final**
  - Tipologia validada + status
  - Conformidade percentual
  - Avisos e recomendações
  - Preço final

## Subtarefas

### 1. Busca e Carregamento (2 min)

```
buscar_tipologia(id) →
{
  nome: string,
  categoria: string,
  especificacoes: {...},
  compatibilidades: {...},
  precificacao: {...}
}
```

### 2. Validação de Conformidade (5 min)

Matriz de validação:
```
DIMENSOES:
  altura? (Y/N)
  largura? (Y/N)

MATERIAIS:
  aluminio? (Y/N)
  vidro? (Y/N)
  acabamento? (Y/N)

PERFORMANCE:
  isolamento_termico ≥ requisito? (Y/N)
  isolamento_acustico ≥ requisito? (Y/N)
  seguranca ≥ requisito? (Y/N)
  hermeticidade ≥ requisito? (Y/N)
```

Cálculo de conformidade:
```
conformidade% = (checks_passou / total_checks) × 100
```

### 3. Análise Ambiental (3 min)

```
IF orientacao == "norte":
  alertas.push("Risco de condensação")
  recomendacoes.push("Vidro low-e")

IF orientacao == "sul":
  alertas.push("Ganho de calor excessivo")
  recomendacoes.push("Vidro refletivo")
```

### 4. Recomendações (3 min)

```
IF conformidade < 100%:
  gerar_alternativas(3)
  calcular_diferenca_preco()
  justificar_recomendacao()
```

### 5. Preço Final (2 min)

```
preco_final = preco_base
            + (customizacoes_count × custo_customizacao)
            + (diferenca_tamanho × preco_m2)
```

## Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Tempo validação | < 5 min |
| Acurácia conformidade | > 99% |
| Taxa erro | < 0.5% |
| Satisfação recomendação | > 90% |

## Error Handling

**Tipologia não existe:**
```yaml
status: "erro"
mensagem: "Tipologia não encontrada"
opcoes_similares:
  - "porta-correr-padrao"
  - "porta-correr-premium"
```

**Dimensões inválidas:**
```yaml
status: "invalido"
erro: "Altura 2600mm exceede limite de 2400mm"
solucoes:
  - "Usar porta-pivotante (permite até 3000mm)"
  - "Dividir em 2 janelas"
```

**Performance insuficiente:**
```yaml
status: "com_restricoes"
avisos:
  - "Isolamento acústico 32dB < 35dB requisitado"
recomendacoes:
  - "Atualizar para vidro acústico (40dB)"
  - "Custo adicional: +R$ 450"
```

## Workflow

```
Entrada → Validar Tipologia
        → Validar Dimensões
        → Validar Especificações
        → Validar Ambiente
        → Validar Performance
        → Gerar Recomendações
        → Calcular Custo
        → Alternativas
        → Output Final
```

## Integração

- **← squad-crm:** Enviar tipologia a validar
- **← corte-optimizer:** Validação para novo pedido
- **→ budget-generator:** Precificação final
- **→ quality-checker:** Validação antes de aprovação

## Exemplo

**Input:**
```json
{
  "tipologia": "porta-correr-premium",
  "dimensoes": {"altura": 2100, "largura": 1500},
  "ambiente": "externo",
  "orientacao": "norte"
}
```

**Output:**
```json
{
  "status": "valido_com_restricoes",
  "conformidade": 95,
  "avisos": ["Risco condensação em norte"],
  "recomendacoes": ["Vidro low-e", "Desumidificação"],
  "preco_final": 4550
}
```

---

*Task: Validar e otimizar tipologia com máxima conformidade técnica*
