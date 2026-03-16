import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ItemFormState } from '@/hooks/useOrcamentoState';

interface Produto {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean | null;
  largura_padrao: number | null;
  altura_padrao: number | null;
  preco: number | null;
}

interface OrcamentoItemDialogProps {
  open: boolean;
  onClose: () => void;
  form: ItemFormState;
  onChange: (form: ItemFormState) => void;
  produtos: Produto[];
  onSubmit: () => void;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function OrcamentoItemDialog({ open, onClose, form, onChange, produtos, onSubmit }: OrcamentoItemDialogProps) {
  const handleProdutoSelect = (prodId: string) => {
    const prod = produtos.find((p) => p.id === prodId);
    if (prod) {
      onChange({
        ...form, produto_id: prodId, descricao: prod.nome,
        largura: String(prod.largura_padrao || ''), altura: String(prod.altura_padrao || ''),
        valor_unitario: String(prod.preco || ''),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Item ao Orçamento</DialogTitle>
          <DialogDescription>Adicione um produto ou item personalizado.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Produto (opcional)</Label>
            <Select value={form.produto_id} onValueChange={handleProdutoSelect}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent>
                {produtos.filter((p) => p.ativo !== false).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome} — {p.tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição <span className="text-destructive">*</span></Label>
            <Input value={form.descricao} onChange={(e) => onChange({ ...form, descricao: e.target.value })} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Largura (mm)</Label><Input type="number" value={form.largura} onChange={(e) => onChange({ ...form, largura: e.target.value })} className="mt-1" /></div>
            <div><Label>Altura (mm)</Label><Input type="number" value={form.altura} onChange={(e) => onChange({ ...form, altura: e.target.value })} className="mt-1" /></div>
          </div>
          {form.largura && form.altura && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs">
              <span className="text-muted-foreground">Área do vidro: </span>
              <span className="font-semibold text-blue-600">
                {((Number(form.largura) / 1000) * (Number(form.altura) / 1000)).toFixed(3)} m²
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={(e) => onChange({ ...form, quantidade: e.target.value })} className="mt-1" min="1" /></div>
            <div>
              <Label>Valor unitário (R$) <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.valor_unitario} onChange={(e) => onChange({ ...form, valor_unitario: e.target.value })} className="mt-1" />
            </div>
          </div>
          {form.quantidade && form.valor_unitario && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs">
              <span className="text-muted-foreground">Subtotal: </span>
              <span className="font-bold text-primary">{fmt(Number(form.quantidade) * Number(form.valor_unitario))}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit}>Adicionar item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
