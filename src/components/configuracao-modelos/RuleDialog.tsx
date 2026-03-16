import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CatalogProfile } from '@/hooks/useConfiguracaoModelos';

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: boolean;
  profiles: CatalogProfile[];
  profileId: string;
  onProfileIdChange: (v: string) => void;
  formula: string;
  onFormulaChange: (v: string) => void;
  qty: string;
  onQtyChange: (v: string) => void;
  angle: string;
  onAngleChange: (v: string) => void;
  axis: string;
  onAxisChange: (v: string) => void;
  previewL: number;
  previewH: number;
  evalFormula: (formula: string, L: number, H: number) => string;
  onSave: () => void;
}

export function RuleDialog({
  open, onOpenChange, editing, profiles, profileId, onProfileIdChange,
  formula, onFormulaChange, qty, onQtyChange, angle, onAngleChange,
  axis, onAxisChange, previewL, previewH, evalFormula, onSave,
}: RuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Regra' : 'Nova Regra de Corte'}</DialogTitle>
          <DialogDescription>Associe um perfil e defina a fórmula de cálculo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-semibold">Perfil de Alumínio</Label>
            <Select value={profileId} onValueChange={onProfileIdChange}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.code} — {p.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold">Fórmula</Label>
            <Input
              placeholder="Ex: L - 45 ou (H / 2) + 10"
              value={formula}
              onChange={(e) => onFormulaChange(e.target.value)}
              className="mt-1 font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Use L para largura e H para altura</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-semibold">Quantidade</Label>
              <Input type="number" value={qty} onChange={(e) => onQtyChange(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Ângulo</Label>
              <Select value={angle} onValueChange={onAngleChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="90°">90°</SelectItem>
                  <SelectItem value="45°">45°</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Eixo</Label>
              <Select value={axis} onValueChange={onAxisChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Largura (L)</SelectItem>
                  <SelectItem value="H">Altura (H)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formula && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Preview (L={previewL}, H={previewH})</p>
              <p className="text-lg font-bold text-primary">{evalFormula(formula, previewL, previewH)}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>{editing ? 'Salvar' : 'Adicionar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
