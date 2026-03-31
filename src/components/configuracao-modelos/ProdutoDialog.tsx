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
  onSave: () => void;
}

export function ProdutoDialog({
  open, onOpenChange, isNew, name, onNameChange,
  description, onDescriptionChange, onSave,
}: ProdutoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Novo Modelo de Esquadria' : 'Editar Modelo'}</DialogTitle>
          <DialogDescription>
            {isNew
              ? 'Cadastre o modelo. Na sequência, defina as regras de corte.'
              : 'Edite as informações do modelo.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Nome do Modelo <span className="text-destructive">*</span></Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="mt-1"
              placeholder="Ex: Janela 2F Correr, Porta Pivotante..."
              autoFocus
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="mt-1"
              placeholder="Tipo de esquadria, materiais, observações..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={!name.trim()}>
            {isNew ? 'Criar e Configurar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
