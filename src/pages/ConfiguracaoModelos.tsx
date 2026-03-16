import { AppLayout } from '@/components/AppLayout';
import { Plus, Search, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RuleDetailView } from '@/components/configuracao-modelos/RuleDetailView';
import { ProdutoDialog } from '@/components/configuracao-modelos/ProdutoDialog';
import { useConfiguracaoModelos } from '@/hooks/useConfiguracaoModelos';

const ConfiguracaoModelos = () => {
  const s = useConfiguracaoModelos();

  if (s.selectedProduct) {
    return (
      <AppLayout>
        <RuleDetailView
          product={s.selectedProduct}
          rules={s.cutRules}
          loading={s.loadingRules}
          profiles={s.profiles}
          previewL={s.previewL}
          previewH={s.previewH}
          onPreviewLChange={s.setPreviewL}
          onPreviewHChange={s.setPreviewH}
          onBack={() => s.setSelectedProduct(null)}
          onNewRule={s.openNewRule}
          onEditRule={s.openEditRule}
          onDeleteRule={s.deleteRule}
          evalFormula={s.evalFormula}
          ruleDialog={s.ruleDialog}
          setRuleDialog={s.setRuleDialog}
          editingRule={s.editingRule}
          ruleProfileId={s.ruleProfileId}
          setRuleProfileId={s.setRuleProfileId}
          ruleFormula={s.ruleFormula}
          setRuleFormula={s.setRuleFormula}
          ruleQty={s.ruleQty}
          setRuleQty={s.setRuleQty}
          ruleAngle={s.ruleAngle}
          setRuleAngle={s.setRuleAngle}
          ruleAxis={s.ruleAxis}
          setRuleAxis={s.setRuleAxis}
          onSaveRule={s.saveRule}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuração de Modelos</h1>
            <p className="text-sm text-muted-foreground">Cadastre produtos, associe perfis e defina fórmulas de corte</p>
          </div>
          <Button onClick={s.openNewProduct} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={s.search} onChange={(e) => s.setSearch(e.target.value)} className="pl-10" />
        </div>

        {s.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />)}
          </div>
        ) : s.filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-3">Nenhum produto cadastrado</p>
            <Button onClick={s.openNewProduct} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Criar Primeiro Produto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {s.filtered.map(product => (
              <button
                key={product.id}
                onClick={() => { s.setSelectedProduct(product); s.loadCutRules(product.id); }}
                className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description || 'Sem descrição'}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); s.deleteProduct(product.id); }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ProdutoDialog
        open={s.productDialog}
        onOpenChange={s.setProductDialog}
        isNew={!s.editingProduct}
        name={s.prodName}
        onNameChange={s.setProdName}
        description={s.prodDesc}
        onDescriptionChange={s.setProdDesc}
        imageUrl={s.prodImage}
        onImageUrlChange={s.setProdImage}
        onSave={s.saveProduct}
      />
    </AppLayout>
  );
};

export default ConfiguracaoModelos;
