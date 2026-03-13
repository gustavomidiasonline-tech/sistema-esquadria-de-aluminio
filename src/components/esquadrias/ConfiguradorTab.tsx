import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcularComponentes, otimizarBarras, type ResultadoCorte, type ResultadoOtimizacao } from "@/lib/calculo-esquadria";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EsquadriaViewer3D } from "./EsquadriaViewer3D";
import { Save, Calculator, Ruler, Weight, BarChart3, Box } from "lucide-react";
import { toast } from "sonner";

export function ConfiguradorTab() {
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [largura, setLargura] = useState<number>(1200);
  const [altura, setAltura] = useState<number>(1000);
  const [show3D, setShow3D] = useState(false);

  const queryClient = useQueryClient();

  const { data: modelos } = useQuery({
    queryKey: ["modelos_esquadria"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modelos_esquadria").select("*").order("categoria, nome");
      if (error) throw error;
      return data;
    },
  });

  const selectedModel = modelos?.find((m) => m.id === selectedModelId);

  const { data: componentes } = useQuery({
    queryKey: ["componentes_modelo", selectedModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("componentes_modelo")
        .select("*, perfis_catalogo(codigo, nome, peso_kg_m)")
        .eq("esquadria_id", selectedModelId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedModelId,
  });

  const resultados: ResultadoCorte[] = useMemo(() => {
    if (!componentes || !selectedModel) return [];
    const comps = componentes.map((c) => ({
      perfil_id: c.perfil_id,
      perfil_codigo: (c as any).perfis_catalogo?.codigo || "???",
      perfil_nome: (c as any).perfis_catalogo?.nome || "Desconhecido",
      quantidade: c.quantidade,
      formula_calculo: c.formula_calculo,
      posicao: c.posicao,
      peso_kg_m: (c as any).perfis_catalogo?.peso_kg_m || 0,
    }));
    return calcularComponentes(comps, largura, altura, selectedModel.folhas || 2);
  }, [componentes, selectedModel, largura, altura]);

  const otimizacao: ResultadoOtimizacao | null = useMemo(() => {
    if (resultados.length === 0) return null;
    return otimizarBarras(resultados, 6000);
  }, [resultados]);

  const pesoTotal = resultados.reduce((s, r) => s + r.peso_total_kg, 0);
  const totalPecas = resultados.reduce((s, r) => s + r.quantidade, 0);

  const salvarProjeto = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: projeto, error } = await supabase
        .from("projetos_esquadria")
        .insert({
          nome: selectedModel?.nome || "Projeto",
          esquadria_id: selectedModelId,
          largura_mm: largura,
          altura_mm: altura,
          created_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Save cutting list
      const listaCorte = resultados.map((r) => ({
        projeto_id: projeto.id,
        perfil_id: r.perfil_id,
        perfil_codigo: r.perfil_codigo,
        perfil_nome: r.perfil_nome,
        comprimento_mm: r.comprimento_mm,
        quantidade: r.quantidade,
        posicao: r.posicao,
      }));

      const { error: err2 } = await supabase.from("lista_corte").insert(listaCorte);
      if (err2) throw err2;
      return projeto;
    },
    onSuccess: () => {
      toast.success("Projeto salvo com lista de corte!");
      queryClient.invalidateQueries({ queryKey: ["projetos_esquadria"] });
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const categorias = { janela: "🪟 Janelas", porta: "🚪 Portas", fachada: "🏢 Fachadas" };

  return (
    <div className="space-y-6 mt-4">
      {/* Model Selection */}
      <Card>
        <CardHeader><CardTitle className="text-base">1. Selecione o Modelo</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedModelId} onValueChange={setSelectedModelId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Escolha um modelo de esquadria..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categorias).map(([cat, label]) => {
                const items = modelos?.filter((m) => m.categoria === cat) || [];
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground">{label}</div>
                    {items.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome} {m.folhas ? `(${m.folhas}F)` : ""}
                      </SelectItem>
                    ))}
                  </div>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dimensions */}
      {selectedModel && (
        <Card>
          <CardHeader><CardTitle className="text-base">2. Defina as Dimensões</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <Label className="text-xs text-muted-foreground">Largura (mm)</Label>
                <Input
                  type="number"
                  value={largura}
                  onChange={(e) => setLargura(Number(e.target.value))}
                  min={selectedModel.largura_min_mm || 0}
                  max={selectedModel.largura_max_mm || 10000}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Mín: {selectedModel.largura_min_mm} / Máx: {selectedModel.largura_max_mm}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Altura (mm)</Label>
                <Input
                  type="number"
                  value={altura}
                  onChange={(e) => setAltura(Number(e.target.value))}
                  min={selectedModel.altura_min_mm || 0}
                  max={selectedModel.altura_max_mm || 10000}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Mín: {selectedModel.altura_min_mm} / Máx: {selectedModel.altura_max_mm}
                </p>
              </div>
            </div>
            {selectedModel.folhas ? (
              <Badge className="mt-3" variant="outline">{selectedModel.folhas} folha(s)</Badge>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {resultados.length > 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Ruler className="h-4 w-4" /> Peças</div>
              <p className="text-2xl font-bold mt-1">{totalPecas}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Weight className="h-4 w-4" /> Peso Total</div>
              <p className="text-2xl font-bold mt-1">{pesoTotal.toFixed(2)} kg</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><BarChart3 className="h-4 w-4" /> Barras (6m)</div>
              <p className="text-2xl font-bold mt-1">{otimizacao?.total_barras || 0}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Calculator className="h-4 w-4" /> Aproveitamento</div>
              <p className="text-2xl font-bold mt-1">{otimizacao?.aproveitamento_medio || 0}%</p>
            </Card>
          </div>

          {/* Cutting list table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">3. Lista de Corte</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setShow3D(!show3D)}>
                  <Box className="h-4 w-4" /> {show3D ? "Ocultar 3D" : "Visualizar 3D"}
                </Button>
                <Button size="sm" className="gap-2" onClick={() => salvarProjeto.mutate()} disabled={salvarProjeto.isPending}>
                  <Save className="h-4 w-4" /> Salvar Projeto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Posição</TableHead>
                      <TableHead className="text-right">Corte (mm)</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Peso (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultados.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono font-bold text-primary">{r.perfil_codigo}</TableCell>
                        <TableCell>{r.perfil_nome}</TableCell>
                        <TableCell><Badge variant="outline">{r.posicao}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{r.comprimento_mm}</TableCell>
                        <TableCell className="text-right font-bold">{r.quantidade}</TableCell>
                        <TableCell className="text-right">{r.peso_total_kg}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Bar optimization */}
          {otimizacao && otimizacao.barras.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">4. Otimização de Barras (6000mm)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {otimizacao.barras.map((barra, bi) => (
                  <div key={bi} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Barra {bi + 1}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{barra.aproveitamento_pct}% uso</Badge>
                        <Badge variant="secondary">Sobra: {barra.sobra_mm}mm</Badge>
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="h-8 bg-muted rounded flex overflow-hidden">
                      {barra.cortes.map((c, ci) => {
                        const pct = (c.comprimento / 6000) * 100;
                        const colors = [
                          "bg-primary", "bg-blue-500", "bg-emerald-500",
                          "bg-amber-500", "bg-purple-500", "bg-rose-500",
                        ];
                        return (
                          <div
                            key={ci}
                            className={`${colors[ci % colors.length]} flex items-center justify-center text-[10px] text-white font-bold border-r border-background`}
                            style={{ width: `${pct}%` }}
                            title={`${c.codigo} - ${c.comprimento}mm`}
                          >
                            {c.comprimento > 300 ? `${c.comprimento}` : ""}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {barra.cortes.map((c, ci) => (
                        <span key={ci} className="text-[11px] text-muted-foreground">
                          {c.codigo} ({c.comprimento}mm){ci < barra.cortes.length - 1 ? " +" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 3D Viewer */}
          {show3D && (
            <Card>
              <CardHeader><CardTitle className="text-base">Visualização 3D</CardTitle></CardHeader>
              <CardContent>
                <EsquadriaViewer3D
                  largura={largura}
                  altura={altura}
                  tipo={selectedModel?.tipo || "correr"}
                  folhas={selectedModel?.folhas || 2}
                  resultados={resultados}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
