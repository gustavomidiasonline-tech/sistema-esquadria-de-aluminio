import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServicosFiltersProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilters: number;
  onClearFilters: () => void;
}

export function ServicosFilters({
  searchTerm, onSearchChange,
  statusFilter, onStatusChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  showFilters, onToggleFilters,
  activeFilters, onClearFilters,
}: ServicosFiltersProps) {
  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar serviço..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={onToggleFilters}>
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
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-40 mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Data de</Label>
            <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="mt-1 h-9 w-40" />
          </div>
          <div>
            <Label className="text-xs">Data até</Label>
            <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="mt-1 h-9 w-40" />
          </div>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>Limpar</Button>
        </div>
      )}
    </>
  );
}
