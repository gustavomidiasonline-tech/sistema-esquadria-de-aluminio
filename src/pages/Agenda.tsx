import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isSameDay, startOfMonth, endOfMonth, parseISO, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, CalendarIcon, Clock, MapPin, User, Trash2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Evento = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  dia_inteiro: boolean;
  cliente_id: string | null;
  pedido_id: string | null;
  servico_id: string | null;
  responsavel: string | null;
  endereco: string | null;
  cor: string;
  status: string;
  observacoes: string | null;
  created_by: string | null;
};

const TIPOS_EVENTO = [
  { value: "instalacao", label: "Instalação", cor: "#22c55e" },
  { value: "visita_tecnica", label: "Visita Técnica", cor: "#3b82f6" },
  { value: "medicao", label: "Medição", cor: "#f59e0b" },
  { value: "entrega", label: "Entrega", cor: "#8b5cf6" },
  { value: "reuniao", label: "Reunião", cor: "#ec4899" },
  { value: "compromisso", label: "Compromisso", cor: "#6b7280" },
];

const STATUS_OPTIONS = [
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const defaultForm = {
  titulo: "",
  descricao: "",
  tipo: "compromisso",
  data_inicio: "",
  hora_inicio: "08:00",
  data_fim: "",
  hora_fim: "09:00",
  dia_inteiro: false,
  responsavel: "",
  endereco: "",
  cor: "#6b7280",
  status: "agendado",
  observacoes: "",
};

export default function Agenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [detailEvento, setDetailEvento] = useState<Evento | null>(null);

  // Fetch events
  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["agenda_eventos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_eventos")
        .select("*")
        .order("data_inicio", { ascending: true });
      if (error) throw error;
      return data as Evento[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form & { id?: string }) => {
      const dataInicio = formData.dia_inteiro
        ? `${formData.data_inicio}T00:00:00`
        : `${formData.data_inicio}T${formData.hora_inicio}:00`;
      const dataFim = formData.dia_inteiro
        ? (formData.data_fim ? `${formData.data_fim}T23:59:59` : `${formData.data_inicio}T23:59:59`)
        : (formData.data_fim
          ? `${formData.data_fim}T${formData.hora_fim}:00`
          : `${formData.data_inicio}T${formData.hora_fim}:00`);

      const payload = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        tipo: formData.tipo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        dia_inteiro: formData.dia_inteiro,
        responsavel: formData.responsavel || null,
        endereco: formData.endereco || null,
        cor: formData.cor,
        status: formData.status,
        observacoes: formData.observacoes || null,
        created_by: user?.id || null,
      };

      if (formData.id) {
        const { error } = await supabase.from("agenda_eventos").update(payload).eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agenda_eventos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda_eventos"] });
      toast.success(editingEvento ? "Evento atualizado!" : "Evento criado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar evento"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_eventos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda_eventos"] });
      toast.success("Evento excluído!");
      setDetailEvento(null);
    },
    onError: () => toast.error("Erro ao excluir evento"),
  });

  // Events for selected date
  const eventosNoDia = useMemo(
    () => eventos.filter((e) => isSameDay(parseISO(e.data_inicio), selectedDate)),
    [eventos, selectedDate]
  );

  // Days with events (for calendar dots)
  const diasComEventos = useMemo(() => {
    const days = new Set<string>();
    eventos.forEach((e) => days.add(format(parseISO(e.data_inicio), "yyyy-MM-dd")));
    return days;
  }, [eventos]);

  function openNewEvento() {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setForm({ ...defaultForm, data_inicio: dateStr, data_fim: dateStr });
    setEditingEvento(null);
    setDialogOpen(true);
  }

  function openEditEvento(evento: Evento) {
    const di = parseISO(evento.data_inicio);
    const df = evento.data_fim ? parseISO(evento.data_fim) : di;
    setForm({
      titulo: evento.titulo,
      descricao: evento.descricao || "",
      tipo: evento.tipo,
      data_inicio: format(di, "yyyy-MM-dd"),
      hora_inicio: format(di, "HH:mm"),
      data_fim: format(df, "yyyy-MM-dd"),
      hora_fim: format(df, "HH:mm"),
      dia_inteiro: evento.dia_inteiro,
      responsavel: evento.responsavel || "",
      endereco: evento.endereco || "",
      cor: evento.cor || "#6b7280",
      status: evento.status,
      observacoes: evento.observacoes || "",
    });
    setEditingEvento(evento);
    setDetailEvento(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingEvento(null);
    setForm(defaultForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo || !form.data_inicio) {
      toast.error("Preencha título e data");
      return;
    }
    saveMutation.mutate({ ...form, id: editingEvento?.id });
  }

  function handleTipoChange(tipo: string) {
    const found = TIPOS_EVENTO.find((t) => t.value === tipo);
    setForm((f) => ({ ...f, tipo, cor: found?.cor || f.cor }));
  }

  function getTipoLabel(tipo: string) {
    return TIPOS_EVENTO.find((t) => t.value === tipo)?.label || tipo;
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "concluido": return "default";
      case "cancelado": return "destructive";
      case "confirmado": return "secondary";
      default: return "outline";
    }
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground text-sm">
              Gerencie instalações, visitas técnicas e compromissos da equipe.
            </p>
          </div>
          <Button onClick={openNewEvento} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Evento
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ptBR}
                className="pointer-events-auto w-full"
                modifiers={{
                  hasEvent: (date) => diasComEventos.has(format(date, "yyyy-MM-dd")),
                }}
                modifiersClassNames={{
                  hasEvent: "bg-primary/20 font-bold",
                }}
              />

              {/* Upcoming events summary */}
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Legenda</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIPOS_EVENTO.map((t) => (
                    <div key={t.value} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.cor }} />
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Day events */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : eventosNoDia.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum evento neste dia.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={openNewEvento}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar evento
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventosNoDia.map((evento) => (
                    <div
                      key={evento.id}
                      className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setDetailEvento(evento)}
                    >
                      <div
                        className="w-1 self-stretch rounded-full flex-shrink-0"
                        style={{ backgroundColor: evento.cor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">{evento.titulo}</span>
                          <Badge variant={getStatusBadgeVariant(evento.status)} className="text-[10px] px-1.5">
                            {STATUS_OPTIONS.find((s) => s.value === evento.status)?.label || evento.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {evento.dia_inteiro
                              ? "Dia inteiro"
                              : format(parseISO(evento.data_inicio), "HH:mm")}
                            {!evento.dia_inteiro && evento.data_fim && ` - ${format(parseISO(evento.data_fim), "HH:mm")}`}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{getTipoLabel(evento.tipo)}</Badge>
                          {evento.responsavel && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {evento.responsavel}
                            </span>
                          )}
                        </div>
                        {evento.endereco && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" /> {evento.endereco}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailEvento} onOpenChange={(open) => !open && setDetailEvento(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: detailEvento?.cor }} />
              {detailEvento?.titulo}
            </DialogTitle>
          </DialogHeader>
          {detailEvento && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getTipoLabel(detailEvento.tipo)}</Badge>
                <Badge variant={getStatusBadgeVariant(detailEvento.status)}>
                  {STATUS_OPTIONS.find((s) => s.value === detailEvento.status)?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {detailEvento.dia_inteiro
                  ? format(parseISO(detailEvento.data_inicio), "dd/MM/yyyy") + " — Dia inteiro"
                  : `${format(parseISO(detailEvento.data_inicio), "dd/MM/yyyy HH:mm")}${detailEvento.data_fim ? ` - ${format(parseISO(detailEvento.data_fim), "HH:mm")}` : ""}`}
              </div>
              {detailEvento.responsavel && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> {detailEvento.responsavel}
                </div>
              )}
              {detailEvento.endereco && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {detailEvento.endereco}
                </div>
              )}
              {detailEvento.descricao && <p className="text-muted-foreground">{detailEvento.descricao}</p>}
              {detailEvento.observacoes && (
                <p className="text-muted-foreground italic text-xs">{detailEvento.observacoes}</p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="destructive" size="sm" onClick={() => detailEvento && deleteMutation.mutate(detailEvento.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
            <Button size="sm" onClick={() => detailEvento && openEditEvento(detailEvento)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvento ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Instalação Residencial" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={handleTipoChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.cor }} />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.dia_inteiro} onCheckedChange={(v) => setForm((f) => ({ ...f, dia_inteiro: v }))} />
              <Label className="cursor-pointer">Dia inteiro</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início *</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} />
              </div>
              {!form.dia_inteiro && (
                <div>
                  <Label>Hora Início</Label>
                  <Input type="time" value={form.hora_inicio} onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={form.data_fim} onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))} />
              </div>
              {!form.dia_inteiro && (
                <div>
                  <Label>Hora Fim</Label>
                  <Input type="time" value={form.hora_fim} onChange={(e) => setForm((f) => ({ ...f, hora_fim: e.target.value }))} />
                </div>
              )}
            </div>

            <div>
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))} placeholder="Nome do responsável" />
            </div>

            <div>
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} placeholder="Local do evento" />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do evento" rows={2} />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} placeholder="Observações adicionais" rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingEvento ? "Atualizar" : "Criar Evento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
