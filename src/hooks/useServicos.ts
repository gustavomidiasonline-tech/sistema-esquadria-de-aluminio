import { useState } from 'react';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Servico = Tables<'servicos'>;
type Cliente = Tables<'clientes'>;

export interface ServicoComCliente extends Servico {
  clientes: Pick<Cliente, 'nome' | 'endereco' | 'telefone' | 'cidade' | 'estado'> | null;
}

export interface ReagendarDialogState {
  id: string;
  numero: number;
  data_agendada: string | null;
}

export interface PagamentoDialogState {
  id: string;
  numero: number;
  valor: number | null;
  cliente_id: string | null;
}

export interface ContratoDialogState {
  id: string;
  numero: number;
  valor: number | null;
  cliente_id: string | null;
  descricao: string | null;
}

export const statusLabels: Record<string, string> = {
  agendado: 'AGENDADO',
  em_andamento: 'EM ANDAMENTO',
  concluido: 'CONCLUÍDO',
  cancelado: 'CANCELADO',
};

const FORM_INITIAL = { cliente_id: '', tipo: 'instalacao', descricao: '', valor: '', data_agendada: '', responsavel: '' };
const PAG_INITIAL = { valor: '', forma_pagamento: 'pix', observacoes: '' };
const CONTRATO_INITIAL = { titulo: '', descricao: '', valor: '' };

export function useServicos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: servicos = [], isLoading } = useSupabaseQuery('servicos', {
    select: '*, clientes(nome, endereco, telefone, cidade, estado)',
    orderBy: { column: 'created_at', ascending: false },
  });
  const { data: clientes = [] } = useSupabaseQuery('clientes');
  const insertMutation = useSupabaseInsert('servicos');
  const updateMutation = useSupabaseUpdate('servicos');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(FORM_INITIAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [reagendarDialog, setReagendarDialog] = useState<ReagendarDialogState | null>(null);
  const [reagendarDate, setReagendarDate] = useState('');
  const [pagamentoDialog, setPagamentoDialog] = useState<PagamentoDialogState | null>(null);
  const [pagForm, setPagForm] = useState(PAG_INITIAL);
  const [contratoDialog, setContratoDialog] = useState<ContratoDialogState | null>(null);
  const [contratoForm, setContratoForm] = useState(CONTRATO_INITIAL);

  const filtered = (servicos as ServicoComCliente[]).filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || s.clientes?.nome?.toLowerCase().includes(term) || String(s.numero).includes(term);
    const matchesStatus = statusFilter === 'todos' || s.status === statusFilter;
    const createdDate = parseISO(s.created_at);
    const matchesDateFrom = !dateFrom || isAfter(createdDate, parseISO(dateFrom));
    const matchesDateTo = !dateTo || isBefore(createdDate, parseISO(dateTo + 'T23:59:59'));
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const getDaysInfo = (date: string | null) => {
    if (!date) return { label: '', overdue: false };
    const diff = differenceInDays(parseISO(date), new Date());
    if (diff < 0) return { label: `Atrasado ${Math.abs(diff)} dias`, overdue: true };
    if (diff === 0) return { label: 'Hoje', overdue: false };
    return { label: `Faltam ${diff} dias`, overdue: false };
  };

  const handleCriar = async () => {
    if (!form.cliente_id) { toast.error('Selecione um cliente'); return; }
    try {
      await insertMutation.mutateAsync({
        cliente_id: form.cliente_id, tipo: form.tipo, descricao: form.descricao,
        valor: Number(form.valor) || 0, data_agendada: form.data_agendada || null,
        responsavel: form.responsavel, created_by: user?.id,
      });
      toast.success('Serviço criado!');
      setForm(FORM_INITIAL);
      setDialogOpen(false);
    } catch { /* error handled by mutation */ }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const values: Partial<Servico> = { status: newStatus as Servico['status'] };
      if (newStatus === 'concluido') values.data_conclusao = new Date().toISOString().split('T')[0];
      await updateMutation.mutateAsync({ id, values });
      toast.success('Status atualizado!');
    } catch { /* error handled by mutation */ }
  };

  const handleReagendar = async () => {
    if (!reagendarDialog || !reagendarDate) { toast.error('Selecione uma data'); return; }
    try {
      await updateMutation.mutateAsync({ id: reagendarDialog.id, values: { data_agendada: reagendarDate } });
      toast.success('Serviço reagendado!');
      setReagendarDialog(null);
      setReagendarDate('');
    } catch { /* error handled by mutation */ }
  };

  const handleRegistrarPagamento = async () => {
    if (!pagamentoDialog || !pagForm.valor) { toast.error('Informe o valor'); return; }
    try {
      const { error } = await supabase.from('pagamentos').insert({
        descricao: `Pagamento Serviço #${pagamentoDialog.numero}`,
        valor: Number(pagForm.valor),
        tipo: 'entrada',
        forma_pagamento: pagForm.forma_pagamento,
        observacoes: pagForm.observacoes,
        cliente_id: pagamentoDialog.cliente_id,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('Pagamento registrado!');
      setPagamentoDialog(null);
      setPagForm(PAG_INITIAL);
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
    } catch (e: unknown) {
      toast.error('Erro: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleCriarContrato = async () => {
    if (!contratoDialog || !contratoForm.titulo) { toast.error('Informe o título'); return; }
    try {
      const { error } = await supabase.from('contratos').insert({
        titulo: contratoForm.titulo,
        descricao: contratoForm.descricao || `Contrato ref. Serviço #${contratoDialog.numero}`,
        valor: Number(contratoForm.valor) || Number(contratoDialog.valor) || 0,
        cliente_id: contratoDialog.cliente_id,
        status: 'rascunho',
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('Contrato criado!');
      setContratoDialog(null);
      setContratoForm(CONTRATO_INITIAL);
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
    } catch (e: unknown) {
      toast.error('Erro: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const openReagendar = (servico: ServicoComCliente) => {
    setReagendarDialog({ id: servico.id, numero: servico.numero, data_agendada: servico.data_agendada });
    setReagendarDate(servico.data_agendada || '');
  };

  const openPagamento = (servico: ServicoComCliente) => {
    setPagamentoDialog({ id: servico.id, numero: servico.numero, valor: servico.valor, cliente_id: servico.cliente_id });
    setPagForm({ valor: String(servico.valor || ''), forma_pagamento: 'pix', observacoes: '' });
  };

  const openContrato = (servico: ServicoComCliente) => {
    setContratoDialog({
      id: servico.id, numero: servico.numero, valor: servico.valor,
      cliente_id: servico.cliente_id, descricao: servico.descricao,
    });
    setContratoForm({ titulo: `Contrato Serviço #${servico.numero}`, descricao: servico.descricao || '', valor: String(servico.valor || '') });
  };

  const clearFilters = () => { setStatusFilter('todos'); setDateFrom(''); setDateTo(''); };
  const activeFilters = (statusFilter !== 'todos' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return {
    servicos, clientes, filtered, isLoading,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    dateFrom, setDateFrom, dateTo, setDateTo,
    showFilters, setShowFilters, activeFilters, clearFilters,
    dialogOpen, setDialogOpen, form, setForm, handleCriar, insertMutation,
    reagendarDialog, setReagendarDialog, reagendarDate, setReagendarDate, handleReagendar,
    pagamentoDialog, setPagamentoDialog, pagForm, setPagForm, handleRegistrarPagamento,
    contratoDialog, setContratoDialog, contratoForm, setContratoForm, handleCriarContrato,
    handleStatusChange, openReagendar, openPagamento, openContrato,
    getDaysInfo, fmt, updateMutation,
  };
}
