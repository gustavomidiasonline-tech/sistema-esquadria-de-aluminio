import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Search, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

const vidros = [
  { id: 1, nome: "Vidro Temperado Incolor 6mm", preco: 105.0, unidade: "m²", categoria: "Temperado" },
  { id: 2, nome: "Vidro Temperado Incolor 8mm", preco: 135.0, unidade: "m²", categoria: "Temperado" },
  { id: 3, nome: "Vidro Temperado Incolor 10mm", preco: 165.0, unidade: "m²", categoria: "Temperado" },
  { id: 4, nome: "Vidro Laminado Incolor 8mm", preco: 180.0, unidade: "m²", categoria: "Laminado" },
  { id: 5, nome: "Vidro Laminado Verde 8mm", preco: 195.0, unidade: "m²", categoria: "Laminado" },
  { id: 6, nome: "Vidro Comum Incolor 4mm", preco: 65.0, unidade: "m²", categoria: "Comum" },
  { id: 7, nome: "Espelho 4mm", preco: 120.0, unidade: "m²", categoria: "Espelho" },
];

const perfis = [
  { id: 1, codigo: "SU-001", nome: "Marco Superior Amadeirado", peso: 0.82, preco: 288.2, unidade: "barra 6m" },
  { id: 2, codigo: "SU-002", nome: "Marco Inferior Amadeirado", peso: 0.76, preco: 276.36, unidade: "barra 6m" },
  { id: 3, codigo: "SU-003", nome: "Montante Amadeirado", peso: 0.65, preco: 234.0, unidade: "barra 6m" },
  { id: 4, codigo: "SU-004", nome: "Folha Preto", peso: 0.58, preco: 198.5, unidade: "barra 6m" },
  { id: 5, codigo: "SU-005", nome: "Trilho Superior Preto", peso: 0.42, preco: 152.0, unidade: "barra 6m" },
  { id: 6, codigo: "SU-006", nome: "Contramarco Branco", peso: 0.35, preco: 126.0, unidade: "barra 6m" },
];

const ferragens = [
  { id: 1, nome: "Fechadura Tetra Cromada", preco: 89.9, unidade: "un" },
  { id: 2, nome: "Puxador Concha Cromado 15cm", preco: 12.5, unidade: "un" },
  { id: 3, nome: "Roldana 4 Rodas Concavo", preco: 18.9, unidade: "par" },
  { id: 4, nome: "Trinco de Pressão Cromado", preco: 6.5, unidade: "un" },
  { id: 5, nome: "Dobradiça Pivotante Inox", preco: 45.0, unidade: "par" },
  { id: 6, nome: "Kit Box Quadrado Cromado", preco: 189.9, unidade: "kit" },
  { id: 7, nome: "Mola de Piso Hidr. 65kg", preco: 320.0, unidade: "un" },
  { id: 8, nome: "Fecho Concha Cromado", preco: 8.9, unidade: "un" },
];

const acessorios = [
  { id: 1, nome: "Silicone Acético Incolor 280ml", preco: 14.9, unidade: "un" },
  { id: 2, nome: "Fita Dupla Face 19mm x 20m", preco: 22.0, unidade: "rolo" },
  { id: 3, nome: "Borracha de Vedação 5x7mm", preco: 3.5, unidade: "metro" },
  { id: 4, nome: "Parafuso 4.2x32 Zincado", preco: 0.15, unidade: "un" },
  { id: 5, nome: "Bucha S6", preco: 0.12, unidade: "un" },
  { id: 6, nome: "Calço de Vidro 5mm", preco: 0.8, unidade: "un" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Precos = () => {
  const [search, setSearch] = useState("");

  const filter = <T extends { nome: string }>(items: T[]) =>
    items.filter((i) => i.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Preço dos Itens</h1>
            <p className="text-sm text-muted-foreground">Configure preços de vidros, perfis, ferragens e acessórios</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo item</Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Tabs defaultValue="vidros">
          <TabsList>
            <TabsTrigger value="vidros">Vidros ({filter(vidros).length})</TabsTrigger>
            <TabsTrigger value="perfis">Perfis ({filter(perfis).length})</TabsTrigger>
            <TabsTrigger value="ferragens">Ferragens ({filter(ferragens).length})</TabsTrigger>
            <TabsTrigger value="acessorios">Acessórios ({filter(acessorios).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="vidros">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filter(vidros).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.nome}</TableCell>
                      <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{v.categoria}</span></TableCell>
                      <TableCell className="text-right font-semibold">{fmt(v.preco)}</TableCell>
                      <TableCell className="text-muted-foreground">{v.unidade}</TableCell>
                      <TableCell><Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="perfis">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Peso (kg/m)</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filter(perfis).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">{p.codigo}</span></TableCell>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-right">{p.peso.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(p.preco)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.unidade}</TableCell>
                      <TableCell><Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="ferragens">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filter(ferragens).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(f.preco)}</TableCell>
                      <TableCell className="text-muted-foreground">{f.unidade}</TableCell>
                      <TableCell><Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="acessorios">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filter(acessorios).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(a.preco)}</TableCell>
                      <TableCell className="text-muted-foreground">{a.unidade}</TableCell>
                      <TableCell><Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Precos;
