---
task: CRUD de Catálogos de Produtos
responsavel: "@squad-estoque"
agent: catalog-manager
type: task-first
---

# manage-catalog

Gerencia criação, atualização, remoção e sincronização de produtos no catálogo.

## Entrada

```yaml
operacao:
  tipo: criar | atualizar | remover | sincronizar
  produto:
    id: string
    sku: string
    nome: string
    categoria: string
    preco: number
    variantes: [...]
    imagens: [...]
```

## Saída

```yaml
resultado:
  operacao: "completada" | "erro"
  produto_id: string
  sku: string
  status_sincronizacao: ok | pendente
  timestamp: ISO8601
```

## Checklist

- [ ] Validar dados produto
- [ ] Verificar SKU único
- [ ] Atualizar banco de dados
- [ ] Validar compatibilidades
- [ ] Sincronizar website
- [ ] Invalidar cache
- [ ] Registrar auditoria
- [ ] Notificar integrações

## Workflow

Validação → Operação BD → Sincronização → Cache → Auditoria → Output

## Integração

- → website/api (sincronização)
- ← compras (novos SKUs)
- → dashboard (atualizações)

---

*Task: Gestão centralizada de catálogo com sincronização automática*
