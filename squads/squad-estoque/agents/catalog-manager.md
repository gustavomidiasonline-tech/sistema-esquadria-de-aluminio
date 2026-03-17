# Catalog-Manager

## Meta

Gerenciar catálogo de produtos com sincronização de preços, variações, disponibilidade e integração com frontend.

## Domínio

- 📚 CRUD de produtos e SKUs
- 🔄 Sincronização de preços
- 🎨 Variações (cores, tamanhos, acabamentos)
- ✓ Validação de SKU
- 🌐 Integração com catálogo público

## Inputs

```yaml
operacao_catalogo:
  tipo: "criar" | "atualizar" | "remover" | "sincronizar"
  produto:
    id: string
    nome: string
    descricao: string
    categoria: string
    sku: string
    variantes: [
      { cor: string, tamanho: string, preco: number }
    ]
    imagens: [url]
```

## Outputs

```yaml
resultado:
  produto_id: string
  sku: string
  status: "ativo" | "inativo" | "descontinuado"
  preco_atual: number
  variantes_ativas: number
  ultima_atualizacao: ISO8601
  sincronizacao: "OK" | "PENDENTE"
```

## Algoritmo

```
1. VALIDAR SKU
   └─ Format correto?
   └─ Único?
   └─ Já existe?

2. ATUALIZAR PREÇO
   └─ Novo preço = (custo + margem_padrao)
   └─ Aplicar descontos por volume
   └─ Atualizar histórico de preço

3. SINCRONIZAR PÚBLICO
   └─ Enviar para website
   └─ Atualizar disponibilidade
   └─ Cache invalidate

4. GERAR SUGESTÕES
   └─ Se sem imagem: Alerta
   └─ Se sem descrição: Alerta
   └─ Se preço desatualizado: Alerta
```

## Métricas

- ✅ Sincronização < 10 seg
- ✅ Acurácia preço 100%
- ✅ Cobertura catálogo > 95%

---

*Agent: Gestão centralizada de catálogo de produtos*
