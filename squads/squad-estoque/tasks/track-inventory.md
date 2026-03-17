---
task: Atualizar e Monitorar Inventário
responsavel: "@squad-estoque"
agent: inventory-tracker
type: task-first
---

# track-inventory

Executa rastreamento em tempo real de movimentações de estoque com histórico e alertas.

## Entrada

```yaml
movimentacao:
  tipo: entrada | saida | devolucao | ajuste
  material_id: string
  quantidade: number
  unidade: m² | unidade
  lote: string
  data: ISO8601
```

## Saída

```yaml
resultado:
  saldo_anterior: number
  saldo_novo: number
  dias_estoque: number
  status_alerta: ok | critico | excesso
  alerta_reposicao: string | null
```

## Checklist

- [ ] Validar movimento
- [ ] Atualizar FIFO/LIFO
- [ ] Registrar histórico
- [ ] Calcular dias estoque
- [ ] Verificar alertas
- [ ] Notificar se necessário
- [ ] Retornar estado atual

## Workflow

Entrada → Validar → Atualizar Saldo → Calcular Dias → Alertas → Output

## Integração

- ← squad-producao (saídas)
- ← compras (entradas)
- → inventory-alerts (alertas)

---

*Task: Rastreamento atualizado do estoque em tempo real*
