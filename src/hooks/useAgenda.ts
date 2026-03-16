import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, isSameDay, parseISO } from 'date-fns';

export type Evento = {
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

export const TIPOS_EVENTO = [
  { value: 'instalacao', label: 'Instalação', cor: '#22c55e' },
  { value: 'visita_tecnica', label: 'Visita Técnica', cor: '#3b82f6' },
  { value: 'medicao', label: 'Medição', cor: '#f59e0b' },
  { value: 'entrega', label: 'Entrega', cor: '#8b5cf6' },
  { value: 'reuniao', label: 'Reunião', cor: '#ec4899' },
  { value: 'compromisso', label: 'Compromisso', cor: '#6b7280' },
];

export const STATUS_OPTIONS = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

const DEFAULT_FORM = {
  titulo: '', descricao: '', tipo: 'compromisso', data_inicio: '', hora_inicio: '08:00',
  data_fim: '', hora_fim: '09:00', dia_inteiro: false, responsavel: '', endereco: '',
  cor: '#6b7280', status: 'agendado', observacoes: '',
};

export function useAgenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [detailEvento, setDetailEvento] = useState<Evento | null>(null);

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ['agenda_eventos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agenda_eventos').select('*').order('data_inicio', { ascending: true });
      if (error) throw error;
      return data as Evento[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form & { id?: string }) => {
      const dataInicio = formData.dia_inteiro ? `${formData.data_inicio}T00:00:00` : `${formData.data_inicio}T${formData.hora_inicio}:00`;
      const dataFim = formData.dia_inteiro ? (formData.data_fim ? `${formData.data_fim}T23:59:59` : `${formData.data_inicio}T23:59:59`) : (formData.data_fim ? `${formData.data_fim}T${formData.hora_fim}:00` : `${formData.data_inicio}T${formData.hora_fim}:00`);
      const payload = { titulo: formData.titulo, descricao: formData.descricao || null, tipo: formData.tipo, data_inicio: dataInicio, data_fim: dataFim, dia_inteiro: formData.dia_inteiro, responsavel: formData.responsavel || null, endereco: formData.endereco || null, cor: formData.cor, status: formData.status, observacoes: formData.observacoes || null, created_by: user?.id || null };
      if (formData.id) {
        const { error } = await supabase.from('agenda_eventos').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agenda_eventos').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda_eventos'] });
      toast.success(editingEvento ? 'Evento atualizado!' : 'Evento criado!');
      closeDialog();
    },
    onError: () => toast.error('Erro ao salvar evento'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agenda_eventos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda_eventos'] });
      toast.success('Evento excluído!');
      setDetailEvento(null);
    },
    onError: () => toast.error('Erro ao excluir evento'),
  });

  const eventosNoDia = useMemo(() => eventos.filter(e => isSameDay(parseISO(e.data_inicio), selectedDate)), [eventos, selectedDate]);
  const diasComEventos = useMemo(() => { const days = new Set<string>(); eventos.forEach(e => days.add(format(parseISO(e.data_inicio), 'yyyy-MM-dd'))); return days; }, [eventos]);

  const openNewEvento = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setForm({ ...DEFAULT_FORM, data_inicio: dateStr, data_fim: dateStr });
    setEditingEvento(null);
    setDialogOpen(true);
  };

  const openEditEvento = (evento: Evento) => {
    const di = parseISO(evento.data_inicio);
    const df = evento.data_fim ? parseISO(evento.data_fim) : di;
    setForm({ titulo: evento.titulo, descricao: evento.descricao || '', tipo: evento.tipo, data_inicio: format(di, 'yyyy-MM-dd'), hora_inicio: format(di, 'HH:mm'), data_fim: format(df, 'yyyy-MM-dd'), hora_fim: format(df, 'HH:mm'), dia_inteiro: evento.dia_inteiro, responsavel: evento.responsavel || '', endereco: evento.endereco || '', cor: evento.cor || '#6b7280', status: evento.status, observacoes: evento.observacoes || '' });
    setEditingEvento(evento);
    setDetailEvento(null);
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingEvento(null); setForm(DEFAULT_FORM); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.titulo || !form.data_inicio) { toast.error('Preencha título e data'); return; } saveMutation.mutate({ ...form, id: editingEvento?.id }); };
  const handleTipoChange = (tipo: string) => { const found = TIPOS_EVENTO.find(t => t.value === tipo); setForm(f => ({ ...f, tipo, cor: found?.cor || f.cor })); };

  return {
    eventos, isLoading, selectedDate, setSelectedDate, currentMonth, setCurrentMonth,
    dialogOpen, setDialogOpen, editingEvento, form, setForm, detailEvento, setDetailEvento,
    eventosNoDia, diasComEventos,
    openNewEvento, openEditEvento, closeDialog, handleSubmit, handleTipoChange,
    saveMutation, deleteMutation,
  };
}
