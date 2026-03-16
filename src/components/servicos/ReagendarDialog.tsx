import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import type { ReagendarDialogState } from '@/hooks/useServicos';

interface ReagendarDialogProps {
  dialog: ReagendarDialogState | null;
  date: string;
  onDateChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function ReagendarDialog({ dialog, date, onDateChange, onClose, onConfirm, isPending }: ReagendarDialogProps) {
  return (
    <Dialog open={!!dialog} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar Serviço #{dialog?.numero}</DialogTitle>
          <DialogDescription>Selecione a nova data para o serviço.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Nova data agendada</Label>
            <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="mt-1" />
          </div>
          {dialog?.data_agendada && (
            <p className="text-xs text-muted-foreground">Data atual: {format(parseISO(dialog.data_agendada), 'dd/MM/yyyy')}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={isPending}>Reagendar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
