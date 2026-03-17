---
task: Alertas Automáticos de Reposição
responsavel: "@squad-estoque"
agent: inventory-tracker
type: task-first
---

# alert-low-stock

Monitora níveis de estoque e dispara alertas automáticos para reposição.

## Entrada

```yaml
monitoramento:
  material_id: string
  quantidade_minima: number
  quantidade_maxima: number
  tempo_reposicao_dias: number
  previsao_demanda_30d: number
```

## Saída

```yaml
alertas:
  - tipo: REPOSICAO_NECESSARIA | EXCESSO | OBSOLENCIA
    material_id: string
    acao_recomendada: string
    urgencia: alta | normal | baixa
    notificacoes: [emails | sms | webhook]
```

## Checklist

- [ ] Monitorar todos materiais críticos
- [ ] Calcular dias em estoque
- [ ] Comparar contra mínimos
- [ ] Avaliar previsão demanda
- [ ] Gerar alertas se necessário
- [ ] Notificar Compras
- [ ] Notificar Gerente
- [ ] Registrar alerta em sistema

## Workflow

Monitoramento → Cálculo Dias → Comparação Limites → Alertas → Notificações

## Integração

- → Compras (requisição)
- → Gerente (notificação)
- → Dashboard (KPI reposição)
- → Financeiro (análise ABC)

## SLA

- ✅ Alerta em < 5 minutos
- ✅ Detecção 100% de materiais críticos
- ✅ Acurácia previsão > 80%

---

*Task: Alertas inteligentes e automáticos para reposição eficiente*
