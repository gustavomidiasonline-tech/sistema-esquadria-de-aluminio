import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrcamentoStatusBadge } from '@/components/orcamentos/OrcamentoStatusBadge';
import { OrcamentoDetail } from '@/components/orcamentos/OrcamentoDetail';
import { Search, Filter, ChevronDown, ChevronUp, Calculator, Plus, Download, ShoppingCart } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

interface OrcamentoListViewProps {
  orcamentos: Record<string, unknown>[];
  allItens: Record<string, unknown>[];
  isLoading: boolean;
  onStatusChange: (id: string, status: string) => void;
  onExportPDF: (orc: Record<string, unknown>) => void;
  onConverterPedido: (orc: Record<string, unknown>) => void;
  onAddItem: (orcId: string) => void;
  onSmartAdd: (orcId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onGerarOP?: (orcId: string) => void;
}

export function OrcamentoListView({
  orcamentos,
  allItens,
  isLoading,
  onStatusChange,
  onExportPDF,
  onConverterPedido,
  onAddItem,
  onSmartAdd,
  onDeleteItem,
  onGerarOP,
}: OrcamentoListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedOrc, setExpandedOrc] = useState<string | null>(null);

  const filtered = orcamentos.filter((o) => {
    const term = searchTerm.toLowerCase();
    const cliente = o.clientes as Record<string, unknown> | null;
    const matchesSearch =
      !term ||
      (cliente?.nome as string | undefined)?.toLowerCase().includes(term) ||
      String(o.numero).includes(term) ||
      (o.descricao as string | undefined)?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
    const createdDate = parseISO(o.created_at as string);
    const matchesDateFrom = !dateFrom || isAfter(createdDate, parseISO(dateFrom));
    const matchesDateTo = !dateTo || isBefore(createdDate, parseISO(dateTo + 'T23:59:59'));
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const activeFilters = (statusFilter !== 'todos' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar orçamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" /> Filtros
          {activeFilters > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="flex items-end gap-3 flex-wrap bg-card border border-border rounded-xl p-4">
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                <SelectItem value="expirado">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Data de</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9 w-40" />
          </div>
          <div>
            <Label className="text-xs">Data até</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9 w-40" />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('todos'); setDateFrom(''); setDateTo(''); }}>
            Limpar
          </Button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum orçamento encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((orc) => {
            const orcId = orc.id as string;
            const isExpanded = expandedOrc === orcId;
            const itensOrc = allItens.filter((i) => i.orcamento_id === orcId);
            const cliente = orc.clientes as Record<string, unknown> | null;
            const totalM2 = itensOrc.reduce((s, i) => {
              if (i.largura && i.altura) {
                return s + ((Number(i.largura) / 1000) * (Number(i.altura) / 1000) * Number(i.quantidade));
              }
              return s;
            }, 0);

            return (
              <div key={orcId} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedOrc(isExpanded ? null : orcId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-bold text-primary">
                        ORC-{String(orc.numero).padStart(3, '0')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{(cliente?.nome as string) ?? '—'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(parseISO(orc.created_at as string), 'dd/MM/yyyy')}
                        {orc.descricao && ` · ${orc.descricao as string}`}
                        {itensOrc.length > 0 && ` · ${itensOrc.length} itens`}
                        {totalM2 > 0 && ` · ${totalM2.toFixed(2)} m²`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{fmt(Number(orc.valor_total) || 0)}</span>
                    <OrcamentoStatusBadge status={orc.status as string} />
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Actions bar */}
                    <div className="flex items-center gap-2 px-5 py-3 bg-muted/20 border-b border-border flex-wrap">
                      <Select value={orc.status as string} onValueChange={(v) => onStatusChange(orcId, v)}>
                        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                          <SelectItem value="expirado">Expirado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => onSmartAdd(orcId)}>
                        <Calculator className="h-3 w-3" /> Calcular item
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onAddItem(orcId)}>
                        <Plus className="h-3 w-3" /> Item manual
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onExportPDF(orc)}>
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                      {orc.status !== 'aprovado' && itensOrc.length > 0 && (
                        <Button
                          size="sm" variant="outline"
                          className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => onConverterPedido(orc)}
                        >
                          <ShoppingCart className="h-3 w-3" /> Converter em pedido
                        </Button>
                      )}
                      {cliente && (
                        <div className={cn('ml-auto text-[10px] text-muted-foreground')}>
                          {cliente.telefone && <span>{cliente.telefone as string}</span>}
                          {cliente.cidade && (
                            <span> · {cliente.cidade as string}/{cliente.estado as string}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Items detail */}
                    <div className="p-5">
                      {itensOrc.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">Nenhum item adicionado</p>
                          <Button size="sm" className="mt-3 gap-1.5" onClick={() => onSmartAdd(orcId)}>
                            <Calculator className="h-3.5 w-3.5" /> Calcular primeiro item
                          </Button>
                        </div>
                      ) : (
                        <OrcamentoDetail orcamento={orc} itens={itensOrc} onDeleteItem={onDeleteItem} onGerarOP={onGerarOP} />
                      )}
                    </div>

                    {orc.observacoes && (
                      <div className="px-5 pb-4">
                        <p className="text-[10px] text-muted-foreground">
                          <strong>Observações:</strong> {orc.observacoes as string}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
