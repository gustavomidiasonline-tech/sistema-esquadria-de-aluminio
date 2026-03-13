import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export function CatalogoTab() {
  const [subTab, setSubTab] = useState("perfis");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4 mt-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="perfis">Perfis</TabsTrigger>
          <TabsTrigger value="linhas">Linhas</TabsTrigger>
          <TabsTrigger value="ferragens">Ferragens</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
        </TabsList>

        <div className="relative max-w-sm mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <TabsContent value="perfis"><PerfisTable search={search} /></TabsContent>
        <TabsContent value="linhas"><LinhasTable search={search} /></TabsContent>
        <TabsContent value="ferragens"><FerragensTable search={search} /></TabsContent>
        <TabsContent value="modelos"><ModelosTable search={search} /></TabsContent>
      </Tabs>
    </div>
  );
}

function PerfisTable({ search }: { search: string }) {
  const { data: perfis, isLoading } = useQuery({
    queryKey: ["perfis_catalogo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("perfis_catalogo").select("*, linhas(nome)").order("codigo");
      if (error) throw error;
      return data;
    },
  });

  const filtered = (perfis || []).filter(
    (p) => p.codigo.toLowerCase().includes(search.toLowerCase()) || p.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;

  return (
    <div className="border border-border rounded-lg overflow-hidden mt-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Linha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Peso (kg/m)</TableHead>
            <TableHead>Barra (mm)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono font-bold text-primary">{p.codigo}</TableCell>
              <TableCell>{p.nome}</TableCell>
              <TableCell>{(p as any).linhas?.nome || "-"}</TableCell>
              <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
              <TableCell>{p.peso_kg_m}</TableCell>
              <TableCell>{p.comprimento_padrao_mm}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LinhasTable({ search }: { search: string }) {
  const { data: linhas, isLoading } = useQuery({
    queryKey: ["linhas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("linhas").select("*, fabricantes(nome)").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const filtered = (linhas || []).filter((l) => l.nome.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;

  return (
    <div className="border border-border rounded-lg overflow-hidden mt-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Espessura (mm)</TableHead>
            <TableHead>Aplicação</TableHead>
            <TableHead>Fabricante</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-bold">{l.nome}</TableCell>
              <TableCell><Badge variant="outline">{l.categoria}</Badge></TableCell>
              <TableCell>{l.espessura_mm}</TableCell>
              <TableCell className="text-sm">{l.aplicacao}</TableCell>
              <TableCell>{(l as any).fabricantes?.nome || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FerragensTable({ search }: { search: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [fabricante, setFabricante] = useState("");
  const [tipo, setTipo] = useState("");
  const [aplicacao, setAplicacao] = useState("");
  const queryClient = useQueryClient();

  const { data: ferragens, isLoading } = useQuery({
    queryKey: ["ferragens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ferragens").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ferragens").insert({ nome, fabricante, tipo, aplicacao });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferragens"] });
      toast.success("Ferragem adicionada!");
      setDialogOpen(false);
      setNome(""); setFabricante(""); setTipo(""); setAplicacao("");
    },
  });

  const filtered = (ferragens || []).filter((f) => f.nome.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;

  return (
    <>
      <div className="flex justify-end mt-3">
        <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Adicionar Ferragem
        </Button>
      </div>
      <div className="border border-border rounded-lg overflow-hidden mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Fabricante</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Aplicação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-bold">{f.nome}</TableCell>
                <TableCell>{f.fabricante}</TableCell>
                <TableCell><Badge variant="outline">{f.tipo}</Badge></TableCell>
                <TableCell className="text-sm">{f.aplicacao}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ferragem</DialogTitle>
            <DialogDescription>Cadastre uma nova ferragem no catálogo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div><Label>Fabricante</Label><Input value={fabricante} onChange={(e) => setFabricante(e.target.value)} /></div>
            <div><Label>Tipo</Label><Input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="roldana, fecho, trinco..." /></div>
            <div><Label>Aplicação</Label><Input value={aplicacao} onChange={(e) => setAplicacao(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => addMut.mutate()} disabled={!nome}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ModelosTable({ search }: { search: string }) {
  const { data: modelos, isLoading } = useQuery({
    queryKey: ["modelos_esquadria"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modelos_esquadria").select("*").order("categoria, nome");
      if (error) throw error;
      return data;
    },
  });

  const filtered = (modelos || []).filter((m) => m.nome.toLowerCase().includes(search.toLowerCase()));
  const categorias = { janela: "Janelas", porta: "Portas", fachada: "Fachadas" };

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;

  return (
    <div className="border border-border rounded-lg overflow-hidden mt-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Folhas</TableHead>
            <TableHead>Largura (mm)</TableHead>
            <TableHead>Altura (mm)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-bold">{m.nome}</TableCell>
              <TableCell>
                <Badge variant={m.categoria === "janela" ? "default" : m.categoria === "porta" ? "secondary" : "outline"}>
                  {(categorias as any)[m.categoria] || m.categoria}
                </Badge>
              </TableCell>
              <TableCell>{m.tipo}</TableCell>
              <TableCell>{m.folhas}</TableCell>
              <TableCell className="text-xs">{m.largura_min_mm} - {m.largura_max_mm}</TableCell>
              <TableCell className="text-xs">{m.altura_min_mm} - {m.altura_max_mm}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
