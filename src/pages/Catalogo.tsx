import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogImportDialog } from '@/components/catalog/CatalogImportDialog';
import { CatalogDebug } from '@/components/debug/CatalogDebug';
import { GetUserCompanyIdDebug } from '@/components/debug/GetUserCompanyIdDebug';
import { ProfileDebug } from '@/components/debug/ProfileDebug';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Package, Layers, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PerfilCatalogo {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  peso_kg_m: number | null;
  espessura_mm: number | null;
  company_id: string | null;
}

interface WindowModel {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  num_folhas: number;
}

export default function Catalogo() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchPerfis, setSearchPerfis] = useState('');
  const [searchModelos, setSearchModelos] = useState('');

  const { data: perfis = [], isLoading: loadingPerfis } = useQuery<PerfilCatalogo[]>({
    queryKey: ['perfis_catalogo'],
    queryFn: async () => {
      // RLS já filtra por empresa, não precisa de .eq()
      const { data, error } = await supabase
        .from('perfis_catalogo')
        .select('id, codigo, nome, tipo, peso_kg_m, espessura_mm, company_id')
        .order('codigo');

      console.log('📊 Query perfis_catalogo:', { data_count: data?.length ?? 0, error });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }
      return data ?? [];
    },
  });

  const { data: modelos = [], isLoading: loadingModelos } = useQuery<WindowModel[]>({
    queryKey: ['window_models'],
    queryFn: async () => {
      // RLS já filtra por empresa, não precisa de .eq()
      const { data, error } = await supabase
        .from('window_models')
        .select('id, codigo, nome, tipo, descricao, num_folhas')
        .order('codigo');

      console.log('📊 Query window_models:', { data_count: data?.length ?? 0, error });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }
      return data ?? [];
    },
  });

  const perfisFiltered = perfis.filter(
    (p) =>
      p.codigo.toLowerCase().includes(searchPerfis.toLowerCase()) ||
      p.nome.toLowerCase().includes(searchPerfis.toLowerCase()),
  );

  const modelosFiltered = modelos.filter(
    (m) =>
      m.codigo.toLowerCase().includes(searchModelos.toLowerCase()) ||
      m.nome.toLowerCase().includes(searchModelos.toLowerCase()),
  );

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['perfis_catalogo'] });
    queryClient.invalidateQueries({ queryKey: ['window_models'] });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Debug */}
        <ProfileDebug />
        <GetUserCompanyIdDebug />
        <CatalogDebug />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catálogo de Fabricantes</h1>
            <p className="text-sm text-muted-foreground">
              Perfis e modelos importados de catálogos — usados nos cálculos automaticamente
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar Catálogo (IA)
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card-premium p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold">{perfis.length}</p>
              <p className="text-xs text-muted-foreground">Perfis no catálogo</p>
            </div>
          </div>
          <div className="glass-card-premium p-4 flex items-center gap-3">
            <Layers className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold">{modelos.length}</p>
              <p className="text-xs text-muted-foreground">Modelos de janelas/portas</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="perfis">
          <TabsList>
            <TabsTrigger value="perfis">Perfis de Alumínio ({perfis.length})</TabsTrigger>
            <TabsTrigger value="modelos">Modelos ({modelos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="perfis" className="space-y-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchPerfis}
                onChange={(e) => setSearchPerfis(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingPerfis ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
            ) : perfisFiltered.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhum perfil no catálogo ainda.</p>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  Importar primeiro catálogo
                </Button>
              </div>
            ) : (
              <div className="glass-card-premium overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 text-muted-foreground font-medium">Código</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Peso (kg/m)</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Esp. (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfisFiltered.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-xs text-blue-300">{p.codigo}</td>
                        <td className="p-3">{p.nome}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-xs">{p.tipo}</Badge>
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {p.peso_kg_m != null ? p.peso_kg_m.toFixed(3) : '—'}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {p.espessura_mm != null ? p.espessura_mm.toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="modelos" className="space-y-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchModelos}
                onChange={(e) => setSearchModelos(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingModelos ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
            ) : modelosFiltered.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhum modelo no catálogo ainda.</p>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  Importar primeiro catálogo
                </Button>
              </div>
            ) : (
              <div className="glass-card-premium overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 text-muted-foreground font-medium">Código</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Folhas</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelosFiltered.map((m) => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-xs text-emerald-300">{m.codigo}</td>
                        <td className="p-3">{m.nome}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-xs">{m.tipo}</Badge>
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{m.num_folhas}</td>
                        <td className="p-3 text-muted-foreground text-xs truncate max-w-xs">
                          {m.descricao ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CatalogImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </AppLayout>
  );
}
