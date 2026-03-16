import { AppLayout } from '@/components/AppLayout';
import { Plus, AlertTriangle, Package, Search, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useEstoque, TIPO_LABELS, TIPO_COLORS } from '@/hooks/useEstoque';
import type { InventoryItemTipo, InventoryItem } from '@/services/inventory.service';
import { DataTable, type ColumnDef } from '@/components/tables';

export default function Estoque() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const s = useEstoque(companyId);

  const estoqueColumns: ColumnDef<InventoryItem>[] = [
    {
      key: 'codigo',
      header: 'Codigo',
      render: (item) => <span className="font-mono text-xs text-primary">{item.codigo}</span>,
    },
    {
      key: 'nome',
      header: 'Nome',
      render: (item) => <p className="text-xs font-medium text-foreground">{item.nome}</p>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (item) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${TIPO_COLORS[item.tipo]}`}>
          {TIPO_LABELS[item.tipo]}
        </span>
      ),
    },
    {
      key: 'quantidade_disponivel',
      header: 'Disponivel',
      align: 'right',
      sortable: true,
      render: (item) => {
        const abaixoMinimo = item.quantidade_disponivel < item.quantidade_minima;
        return (
          <>
            <span className={`text-xs font-semibold ${abaixoMinimo ? 'text-red-600' : 'text-foreground'}`}>
              {item.quantidade_disponivel} {item.unidade}
            </span>
            {abaixoMinimo && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
          </>
        );
      },
    },
    {
      key: 'quantidade_reservada',
      header: 'Reservado',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-muted-foreground">{item.quantidade_reservada} {item.unidade}</span>
      ),
    },
    {
      key: 'quantidade_minima',
      header: 'Minimo',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-muted-foreground">{item.quantidade_minima} {item.unidade}</span>
      ),
    },
    {
      key: 'localizacao',
      header: 'Local',
      render: (item) => (
        <span className="text-[10px] text-muted-foreground">{item.localizacao ?? '\u2014'}</span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
            <p className="text-sm text-muted-foreground">Gerencie perfis, vidros, ferragens e acessórios</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => s.refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
            <Button onClick={s.openNew}><Plus className="h-4 w-4 mr-1" /> Novo Item</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Total de itens</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.totalItens}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">Unidades em estoque</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.totalValorEstoque.toLocaleString('pt-BR')}</p>
          </div>
          <div className={`border rounded-xl p-4 bg-card ${s.totalAlertas > 0 ? 'border-red-300 bg-red-500/15' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`h-4 w-4 ${s.totalAlertas > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground font-medium">Alertas de estoque</span>
            </div>
            <p className={`text-2xl font-bold ${s.totalAlertas > 0 ? 'text-red-600' : 'text-foreground'}`}>{s.totalAlertas}</p>
          </div>
        </div>

        {s.totalAlertas > 0 && (
          <div className="border border-red-500/30 bg-red-500/15 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">Itens abaixo do estoque mínimo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {s.alertas.map(a => (
                <div key={a.itemId} className="glass-card-premium border-red-500/30 p-3">
                  <p className="text-xs font-semibold text-foreground">{a.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{a.codigo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-red-600 font-medium">{a.disponivel}/{a.minimo}</span>
                    <span className="text-[10px] text-red-500">faltam {a.deficit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por código ou nome..." value={s.search} onChange={(e) => s.setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={s.tipoFiltro} onValueChange={(v) => s.setTipoFiltro(v as InventoryItemTipo | 'todos')}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {(Object.keys(TIPO_LABELS) as InventoryItemTipo[]).map(t => (
                <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable<InventoryItem>
          data={s.itensFiltrados}
          columns={estoqueColumns}
          isLoading={s.isLoading}
          emptyMessage="Nenhum item encontrado"
          emptyIcon={<Package className="h-10 w-10 text-muted-foreground" />}
          rowClassName={(item) =>
            item.quantidade_disponivel < item.quantidade_minima ? 'bg-red-500/10' : undefined
          }
          renderActions={(item) => (
            <>
              <button onClick={() => s.openEdit(item)} className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => s.deleteMutation.mutate(item)} className="h-7 w-7 rounded flex items-center justify-center hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </>
          )}
          footerContent={
            <span>{s.itensFiltrados.length} {s.itensFiltrados.length === 1 ? 'item' : 'itens'}</span>
          }
        />
      </div>

      <Dialog open={s.dialogOpen} onOpenChange={(v) => { s.setDialogOpen(v); if (!v) s.closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{s.editingItem ? 'Editar Item' : 'Novo Item de Estoque'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="codigo">Código *</Label>
                <Input id="codigo" value={s.form.codigo} onChange={(e) => s.setForm({ ...s.form, codigo: e.target.value })} placeholder="P-001" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={s.form.tipo} onValueChange={(v) => s.setForm({ ...s.form, tipo: v as InventoryItemTipo })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_LABELS) as InventoryItemTipo[]).map(t => (
                      <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={s.form.nome} onChange={(e) => s.setForm({ ...s.form, nome: e.target.value })} placeholder="Perfil Marco 40x60mm" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qtd">Qtd. disponível</Label>
                <Input id="qtd" type="number" min="0" value={s.form.quantidade_disponivel} onChange={(e) => s.setForm({ ...s.form, quantidade_disponivel: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min">Qtd. mínima</Label>
                <Input id="min" type="number" min="0" value={s.form.quantidade_minima} onChange={(e) => s.setForm({ ...s.form, quantidade_minima: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unidade">Unidade</Label>
                <Input id="unidade" value={s.form.unidade} onChange={(e) => s.setForm({ ...s.form, unidade: e.target.value })} placeholder="barra" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="local">Localização</Label>
              <Input id="local" value={s.form.localizacao} onChange={(e) => s.setForm({ ...s.form, localizacao: e.target.value })} placeholder="Prateleira A-3" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={s.closeDialog}>Cancelar</Button>
              <Button className="flex-1" onClick={s.handleSave} disabled={s.saveMutation.isPending}>
                {s.saveMutation.isPending ? 'Salvando...' : s.editingItem ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
