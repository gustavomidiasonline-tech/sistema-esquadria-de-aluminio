import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ServicosKPIs } from '@/components/servicos/ServicosKPIs';
import { ServicoCard } from '@/components/servicos/ServicoCard';
import { ServicosFilters } from '@/components/servicos/ServicosFilters';
import { NovoServicoDialog } from '@/components/servicos/NovoServicoDialog';
import { ReagendarDialog } from '@/components/servicos/ReagendarDialog';
import { PagamentoDialog } from '@/components/servicos/PagamentoDialog';
import { ContratoDialog } from '@/components/servicos/ContratoDialog';
import { useServicos, type ServicoComCliente } from '@/hooks/useServicos';
import type { Tables } from '@/integrations/supabase/types';

type Cliente = Tables<'clientes'>;

const handleImprimir = (servico: ServicoComCliente) => {
  const cliente = servico.clientes;
  const content = `
    <html><head><title>Serviço #${servico.numero}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}
    h1{font-size:22px;border-bottom:2px solid #7c3aed;padding-bottom:8px}
    .info{margin:16px 0;line-height:1.8}.label{font-weight:bold;color:#555}
    .valor{font-size:24px;color:#7c3aed;font-weight:bold;margin:16px 0}</style></head>
    <body>
      <h1>ORDEM DE SERVIÇO #${servico.numero}</h1>
      <div class="info">
        <p><span class="label">Cliente:</span> ${cliente?.nome || '—'}</p>
        <p><span class="label">Endereço:</span> ${cliente?.endereco || '—'}${cliente?.cidade ? `, ${cliente.cidade}` : ''}</p>
        <p><span class="label">Telefone:</span> ${cliente?.telefone || '—'}</p>
        <p><span class="label">Responsável:</span> ${servico.responsavel || '—'}</p>
        <p><span class="label">Tipo:</span> ${servico.tipo || '—'}</p>
        <p><span class="label">Status:</span> ${servico.status}</p>
        <p><span class="label">Data Agendada:</span> ${servico.data_agendada ? format(parseISO(servico.data_agendada), 'dd/MM/yyyy') : '—'}</p>
        <p><span class="label">Descrição:</span> ${servico.descricao || '—'}</p>
      </div>
      <p class="valor">Valor: R$ ${Number(servico.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p style="margin-top:40px;font-size:12px;color:#999">Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
    </body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(content); win.document.close(); win.print(); }
};

const Servicos = () => {
  const s = useServicos();

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <Button className="gap-2" onClick={() => s.setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo serviço</Button>
        </div>

        <ServicosKPIs servicos={s.servicos} />

        <ServicosFilters
          searchTerm={s.searchTerm} onSearchChange={s.setSearchTerm}
          statusFilter={s.statusFilter} onStatusChange={s.setStatusFilter}
          dateFrom={s.dateFrom} onDateFromChange={s.setDateFrom}
          dateTo={s.dateTo} onDateToChange={s.setDateTo}
          showFilters={s.showFilters} onToggleFilters={() => s.setShowFilters(!s.showFilters)}
          activeFilters={s.activeFilters} onClearFilters={s.clearFilters}
        />

        {s.isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : s.filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum serviço encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {s.filtered.map((servico) => (
              <ServicoCard
                key={servico.id}
                servico={servico}
                daysInfo={s.getDaysInfo(servico.data_agendada)}
                fmt={s.fmt}
                onReagendar={s.openReagendar}
                onPagamento={s.openPagamento}
                onContrato={s.openContrato}
                onImprimir={handleImprimir}
                onStatusChange={s.handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      <NovoServicoDialog
        open={s.dialogOpen} onOpenChange={s.setDialogOpen}
        form={s.form} onFormChange={s.setForm}
        onSubmit={s.handleCriar}
        clientes={s.clientes as Cliente[]}
        isPending={s.insertMutation.isPending}
      />

      <ReagendarDialog
        dialog={s.reagendarDialog} date={s.reagendarDate}
        onDateChange={s.setReagendarDate} onClose={() => s.setReagendarDialog(null)}
        onConfirm={s.handleReagendar} isPending={s.updateMutation.isPending}
      />

      <PagamentoDialog
        dialog={s.pagamentoDialog} form={s.pagForm}
        onFormChange={s.setPagForm} onClose={() => s.setPagamentoDialog(null)}
        onConfirm={s.handleRegistrarPagamento}
      />

      <ContratoDialog
        dialog={s.contratoDialog} form={s.contratoForm}
        onFormChange={s.setContratoForm} onClose={() => s.setContratoDialog(null)}
        onConfirm={s.handleCriarContrato}
      />
    </AppLayout>
  );
};

export default Servicos;
