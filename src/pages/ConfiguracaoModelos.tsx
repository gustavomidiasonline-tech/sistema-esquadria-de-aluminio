import { AppLayout } from '@/components/AppLayout';
import { Plus, Search, Trash2, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
          onBack={() => { s.setSelectedProduct(null); }}
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
            <p className="text-sm text-muted-foreground">
              Cadastre modelos de esquadria e defina as fórmulas de corte para cada perfil
            </p>
          </div>
          <Button onClick={s.openNewProduct} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Modelo
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar modelo..." value={s.search} onChange={(e) => s.setSearch(e.target.value)} className="pl-10" />
        </div>

        {s.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-36 bg-muted/50 rounded-xl animate-pulse" />)}
          </div>
        ) : s.filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-1">Nenhum modelo cadastrado</p>
            <p className="text-xs text-muted-foreground mb-4">
              Crie um modelo para começar a configurar fórmulas de corte
            </p>
            <Button onClick={s.openNewProduct} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Criar Primeiro Modelo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {s.filtered.map(product => {
              const ruleCount = product.rule_count ?? 0;
              const isConfigured = ruleCount > 0;

              return (
                <div
                  key={product.id}
                  className="glass-card-premium p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer"
                  onClick={() => { s.setSelectedProduct(product); s.loadCutRules(product.id); }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {product.description || 'Sem descrição'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    {isConfigured ? (
                      <Badge variant="outline" className="gap-1 text-[11px] text-emerald-600 border-emerald-600/30 bg-emerald-500/10">
                        <CheckCircle2 className="h-3 w-3" />
                        {ruleCount} {ruleCount === 1 ? 'regra' : 'regras'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[11px] text-amber-600 border-amber-600/30 bg-amber-500/10">
                        <AlertTriangle className="h-3 w-3" />
                        Sem regras
                      </Badge>
                    )}

                    <div className="flex-1" />

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); s.deleteProduct(product.id); }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remover
                    </Button>
                  </div>
                </div>
              );
            })}
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
        onSave={s.saveProduct}
      />
    </AppLayout>
  );
};

export default ConfiguracaoModelos;
