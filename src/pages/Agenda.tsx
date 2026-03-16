import { AppLayout } from '@/components/AppLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, CalendarIcon, Clock, MapPin, User, Trash2, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAgenda, TIPOS_EVENTO, STATUS_OPTIONS } from '@/hooks/useAgenda';

export default function Agenda() {
  const s = useAgenda();

  const getTipoLabel = (tipo: string) => TIPOS_EVENTO.find(t => t.value === tipo)?.label || tipo;
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'concluido': return 'default';
      case 'cancelado': return 'destructive';
      case 'confirmado': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground text-sm">Gerencie instalações, visitas técnicas e compromissos da equipe.</p>
          </div>
          <Button onClick={s.openNewEvento} className="gap-2"><Plus className="h-4 w-4" /> Novo Evento</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={s.selectedDate}
                onSelect={(d) => d && s.setSelectedDate(d)}
                month={s.currentMonth}
                onMonthChange={s.setCurrentMonth}
                locale={ptBR}
                modifiers={{ hasEvent: (date) => s.diasComEventos.has(format(date, 'yyyy-MM-dd')) }}
                modifiersClassNames={{ hasEvent: 'bg-primary/20 font-bold' }}
              />
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Legenda</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIPOS_EVENTO.map(t => (
                    <div key={t.value} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.cor }} />
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {format(s.selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {s.isLoading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : s.eventosNoDia.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum evento neste dia.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={s.openNewEvento}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar evento
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {s.eventosNoDia.map(evento => (
                    <div key={evento.id} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => s.setDetailEvento(evento)}>
                      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: evento.cor }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">{evento.titulo}</span>
                          <Badge variant={getStatusVariant(evento.status)} className="text-[10px] px-1.5">
                            {STATUS_OPTIONS.find(s => s.value === evento.status)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {evento.dia_inteiro ? 'Dia inteiro' : format(parseISO(evento.data_inicio), 'HH:mm')}
                            {!evento.dia_inteiro && evento.data_fim && ` - ${format(parseISO(evento.data_fim), 'HH:mm')}`}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{getTipoLabel(evento.tipo)}</Badge>
                          {evento.responsavel && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {evento.responsavel}</span>}
                        </div>
                        {evento.endereco && <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><MapPin className="h-3 w-3" /> {evento.endereco}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!s.detailEvento} onOpenChange={(open) => !open && s.setDetailEvento(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.detailEvento?.cor }} />
              {s.detailEvento?.titulo}
            </DialogTitle>
          </DialogHeader>
          {s.detailEvento && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getTipoLabel(s.detailEvento.tipo)}</Badge>
                <Badge variant={getStatusVariant(s.detailEvento.status)}>
                  {STATUS_OPTIONS.find(st => st.value === s.detailEvento.status)?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {s.detailEvento.dia_inteiro ? format(parseISO(s.detailEvento.data_inicio), 'dd/MM/yyyy') + ' — Dia inteiro' : `${format(parseISO(s.detailEvento.data_inicio), 'dd/MM/yyyy HH:mm')}${s.detailEvento.data_fim ? ` - ${format(parseISO(s.detailEvento.data_fim), 'HH:mm')}` : ''}`}
              </div>
              {s.detailEvento.responsavel && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> {s.detailEvento.responsavel}</div>}
              {s.detailEvento.endereco && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {s.detailEvento.endereco}</div>}
              {s.detailEvento.descricao && <p className="text-muted-foreground">{s.detailEvento.descricao}</p>}
              {s.detailEvento.observacoes && <p className="text-muted-foreground italic text-xs">{s.detailEvento.observacoes}</p>}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="destructive" size="sm" onClick={() => s.detailEvento && s.deleteMutation.mutate(s.detailEvento.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
            <Button size="sm" onClick={() => s.detailEvento && s.openEditEvento(s.detailEvento)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={s.dialogOpen} onOpenChange={(open) => !open && s.closeDialog()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{s.editingEvento ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={s.handleSubmit} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={s.form.titulo} onChange={(e) => s.setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Instalação Residencial" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={s.form.tipo} onValueChange={s.handleTipoChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={s.form.status} onValueChange={(v) => s.setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(st => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={s.form.dia_inteiro} onCheckedChange={(v) => s.setForm(f => ({ ...f, dia_inteiro: v }))} />
              <Label className="cursor-pointer">Dia inteiro</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início *</Label>
                <Input type="date" value={s.form.data_inicio} onChange={(e) => s.setForm(f => ({ ...f, data_inicio: e.target.value }))} />
              </div>
              {!s.form.dia_inteiro && (
                <div>
                  <Label>Hora Início</Label>
                  <Input type="time" value={s.form.hora_inicio} onChange={(e) => s.setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={s.form.data_fim} onChange={(e) => s.setForm(f => ({ ...f, data_fim: e.target.value }))} />
              </div>
              {!s.form.dia_inteiro && (
                <div>
                  <Label>Hora Fim</Label>
                  <Input type="time" value={s.form.hora_fim} onChange={(e) => s.setForm(f => ({ ...f, hora_fim: e.target.value }))} />
                </div>
              )}
            </div>
            <div><Label>Responsável</Label><Input value={s.form.responsavel} onChange={(e) => s.setForm(f => ({ ...f, responsavel: e.target.value }))} placeholder="Nome do responsável" /></div>
            <div><Label>Endereço</Label><Input value={s.form.endereco} onChange={(e) => s.setForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Local do evento" /></div>
            <div><Label>Descrição</Label><Textarea value={s.form.descricao} onChange={(e) => s.setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do evento" rows={2} /></div>
            <div><Label>Observações</Label><Textarea value={s.form.observacoes} onChange={(e) => s.setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Observações adicionais" rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={s.closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={s.saveMutation.isPending}>
                {s.saveMutation.isPending ? 'Salvando...' : s.editingEvento ? 'Atualizar' : 'Criar Evento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
