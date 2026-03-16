import { MapPin, Phone, User, RotateCcw, DollarSign, FileText, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ServiceWorkflow } from '@/components/servicos/ServiceWorkflow';
import { statusLabels, type ServicoComCliente } from '@/hooks/useServicos';

interface ServicoCardProps {
  servico: ServicoComCliente;
  daysInfo: { label: string; overdue: boolean };
  fmt: (v: number) => string;
  onReagendar: (servico: ServicoComCliente) => void;
  onPagamento: (servico: ServicoComCliente) => void;
  onContrato: (servico: ServicoComCliente) => void;
  onImprimir: (servico: ServicoComCliente) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export function ServicoCard({
  servico, daysInfo, fmt,
  onReagendar, onPagamento, onContrato, onImprimir, onStatusChange,
}: ServicoCardProps) {
  const cliente = servico.clientes;
  const { label: daysLabel, overdue } = daysInfo;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
      <div className="p-4 pb-2 space-y-2">
        <h3 className="text-base font-bold text-foreground">SERVIÇO #{servico.numero}</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-start gap-1.5">
            <User className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="font-medium text-foreground">{cliente?.nome || 'Sem cliente'}</span>
          </div>
          {cliente?.endereco && (
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{cliente.endereco}{cliente.cidade ? `, ${cliente.cidade}` : ''}</span>
            </div>
          )}
          {cliente?.telefone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{cliente.telefone}</span>
            </div>
          )}
        </div>
        <div className="text-xs space-y-0.5">
          {servico.responsavel && (
            <p className="text-muted-foreground"><span className="font-medium text-foreground">Responsável:</span> {servico.responsavel}</p>
          )}
          <div className="flex items-center justify-between">
            {servico.data_agendada && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Previsão:</span> {format(parseISO(servico.data_agendada), 'dd/MM/yyyy')}
              </p>
            )}
            {daysLabel && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${overdue ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-success/30 bg-success/10 text-success'}`}>
                {daysLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className={`text-lg font-bold ${overdue ? 'text-destructive' : 'text-primary'}`}>{fmt(Number(servico.valor) || 0)}</p>
          <p className="text-[10px] text-muted-foreground">{format(parseISO(servico.created_at), 'dd/MM/yyyy HH:mm')}</p>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border">
        <p className="text-xs font-bold text-foreground">{statusLabels[servico.status] || servico.status}</p>
        {servico.tipo && <p className="text-[10px] text-muted-foreground mt-0.5">Tipo: {servico.tipo}</p>}
        {servico.descricao && <p className="text-[10px] text-muted-foreground">{servico.descricao}</p>}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between">
          {[
            { icon: RotateCcw, label: 'Reagendar', action: () => onReagendar(servico) },
            { icon: DollarSign, label: 'Pagamentos', action: () => onPagamento(servico) },
            { icon: FileText, label: 'Contrato', action: () => onContrato(servico) },
            { icon: Printer, label: 'Impressões', action: () => onImprimir(servico) },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
              <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <ServiceWorkflow servicoId={servico.id} servicoStatus={servico.status} />

      <div className="flex gap-2 p-4 pt-0 mt-auto">
        {servico.status !== 'cancelado' && (
          <button onClick={() => onStatusChange(servico.id, 'cancelado')}
            className="flex-1 py-2 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
        )}
        {servico.status !== 'concluido' && servico.status !== 'cancelado' && (
          <button onClick={() => onStatusChange(servico.id, servico.status === 'agendado' ? 'em_andamento' : 'concluido')}
            className="flex-1 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            {servico.status === 'agendado' ? 'Iniciar serviço' : 'Concluir serviço'}
          </button>
        )}
      </div>
    </div>
  );
}
