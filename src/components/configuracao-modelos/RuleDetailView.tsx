import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RuleDialog } from './RuleDialog';
import type { Product, CutRule, CatalogProfile } from '@/hooks/useConfiguracaoModelos';

interface RuleDetailViewProps {
  product: Product;
  rules: CutRule[];
  loading: boolean;
  profiles: CatalogProfile[];
  previewL: string;
  previewH: string;
  onPreviewLChange: (v: string) => void;
  onPreviewHChange: (v: string) => void;
  onBack: () => void;
  onNewRule: () => void;
  onEditRule: (r: CutRule) => void;
  onDeleteRule: (id: string) => void;
  evalFormula: (formula: string, L: number, H: number) => string;
  ruleDialog: boolean;
  setRuleDialog: (v: boolean) => void;
  editingRule: CutRule | null;
  ruleProfileId: string;
  setRuleProfileId: (v: string) => void;
  ruleFormula: string;
  setRuleFormula: (v: string) => void;
  ruleQty: string;
  setRuleQty: (v: string) => void;
  ruleAngle: string;
  setRuleAngle: (v: string) => void;
  ruleAxis: string;
  setRuleAxis: (v: string) => void;
  onSaveRule: () => void;
}

export function RuleDetailView({
  product, rules, loading, profiles, previewL, previewH,
  onPreviewLChange, onPreviewHChange, onBack, onNewRule, onEditRule, onDeleteRule,
  evalFormula, ruleDialog, setRuleDialog, editingRule, ruleProfileId, setRuleProfileId,
  ruleFormula, setRuleFormula, ruleQty, setRuleQty, ruleAngle, setRuleAngle,
  ruleAxis, setRuleAxis, onSaveRule,
}: RuleDetailViewProps) {
  const L = parseInt(previewL) || 0;
  const H = parseInt(previewH) || 0;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground">{product.description || 'Configuração de fórmulas de corte'}</p>
        </div>
        <Button variant="outline" size="sm">Editar Produto</Button>
      </div>

      <div className="glass-card-premium p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Simulador de Corte</h3>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Largura (L)</Label>
            <Input type="number" value={previewL} onChange={(e) => onPreviewLChange(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Altura (H)</Label>
            <Input type="number" value={previewH} onChange={(e) => onPreviewHChange(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="glass-card-premium overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Regras de Corte ({rules.length})</h3>
          <Button size="sm" onClick={onNewRule} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Adicionar Regra
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma regra de corte cadastrada</p>
            <Button size="sm" variant="outline" onClick={onNewRule} className="mt-3 gap-2">
              <Plus className="h-3.5 w-3.5" /> Primeira Regra
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Perfil</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Eixo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Fórmula</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Qtd</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Ângulo</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs">Resultado</th>
                  <th className="p-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <p className="font-semibold text-foreground">{rule.profile?.code ?? '—'}</p>
                      <p className="text-[11px] text-muted-foreground">{rule.profile?.description || ''}</p>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        rule.axis === 'L' ? 'bg-blue-500/15 text-blue-300' : 'bg-purple-500/15 text-purple-300'
                      )}>
                        {rule.axis === 'L' ? 'Largura' : 'Altura'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-foreground">{rule.formula}</td>
                    <td className="p-3 text-foreground">{rule.quantity ?? 1}</td>
                    <td className="p-3 text-foreground">{rule.angle ?? '—'}</td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-primary">{evalFormula(rule.formula, L, H)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEditRule(rule)}>
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDeleteRule(rule.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RuleDialog
        open={ruleDialog}
        onOpenChange={setRuleDialog}
        editing={!!editingRule}
        profiles={profiles}
        profileId={ruleProfileId}
        onProfileIdChange={setRuleProfileId}
        formula={ruleFormula}
        onFormulaChange={setRuleFormula}
        qty={ruleQty}
        onQtyChange={setRuleQty}
        angle={ruleAngle}
        onAngleChange={setRuleAngle}
        axis={ruleAxis}
        onAxisChange={setRuleAxis}
        previewL={parseInt(previewL) || 0}
        previewH={parseInt(previewH) || 0}
        evalFormula={evalFormula}
        onSave={onSaveRule}
      />
    </div>
  );
}
