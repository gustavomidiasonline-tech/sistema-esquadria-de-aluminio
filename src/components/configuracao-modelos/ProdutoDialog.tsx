import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProdutoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isNew: boolean;
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  imageUrl: string;
  onImageUrlChange: (v: string) => void;
  onSave: () => void;
}

export function ProdutoDialog({
  open, onOpenChange, isNew, name, onNameChange,
  description, onDescriptionChange, imageUrl, onImageUrlChange, onSave,
}: ProdutoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? 'Novo Produto' : 'Editar Produto'}</DialogTitle>
          <DialogDescription>Defina o modelo de esquadria.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Nome <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => onNameChange(e.target.value)} className="mt-1" placeholder="Ex: Janela 2 Folhas de Vidro" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} className="mt-1" placeholder="Descrição do modelo..." />
          </div>
          <div>
            <Label>URL da Imagem</Label>
            <Input value={imageUrl} onChange={(e) => onImageUrlChange(e.target.value)} className="mt-1" placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>{isNew ? 'Criar' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
