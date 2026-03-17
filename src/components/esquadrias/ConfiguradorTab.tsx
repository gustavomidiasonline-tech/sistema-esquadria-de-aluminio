import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcularComponentes, otimizarBarrasPorPerfil, calcularVidros, calcularFerragens, calcularMateriaisAuxiliares, type ResultadoCorte, type GrupoCorteOtimizado, type ItemVidro, type ItemFerragem } from "@/lib/calculo-esquadria";
import type { Database } from "@/integrations/supabase/types";

type ComponenteRow = Database["public"]["Tables"]["componentes_modelo"]["Row"];
type ComponenteWithJoins = ComponenteRow & {
  perfis_catalogo?: { codigo: string; nome: string; peso_kg_m: number | null } | null;
};
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
      return data as unknown as ComponenteWithJoins[];
    },
    enabled: !!selectedModelId,
  });

  const resultados: ResultadoCorte[] = useMemo(() => {
    if (!componentes || !selectedModel) return [];
    const comps = componentes.map((c) => ({
      perfil_id: c.perfil_id,
      perfil_codigo: c.perfis_catalogo?.codigo || "???",
      perfil_nome: c.perfis_catalogo?.nome || "Desconhecido",
      quantidade: c.quantidade,
      formula_calculo: c.formula_calculo,
      posicao: c.posicao,
      peso_kg_m: c.perfis_catalogo?.peso_kg_m || 0,
    }));
    return calcularComponentes(comps, largura, altura, selectedModel.folhas || 2);
  }, [componentes, selectedModel, largura, altura]);

  const planoCorte: GrupoCorteOtimizado[] = useMemo(() => {
    if (resultados.length === 0) return [];
    return otimizarBarrasPorPerfil(resultados, 6000);
  }, [resultados]);

  const vidros: ItemVidro[] = useMemo(() => {
    if (!selectedModel) return [];
    return calcularVidros(selectedModel.tipo || 'correr', largura, altura, selectedModel.folhas || 2);
  }, [selectedModel, largura, altura]);

  const ferragens: ItemFerragem[] = useMemo(() => {
    if (!selectedModel) return [];
    return calcularFerragens(selectedModel.tipo || 'correr', largura, altura, selectedModel.folhas || 2);
  }, [selectedModel, largura, altura]);

  const materiaisAux: ItemFerragem[] = useMemo(() => {
    if (!selectedModel) return [];
    return calcularMateriaisAuxiliares(selectedModel.tipo || 'correr', largura, altura);
  }, [selectedModel, largura, altura]);

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
              <p className="text-2xl font-bold mt-1">{planoCorte.reduce((s, g) => s + g.otimizacao.total_barras, 0)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Calculator className="h-4 w-4" /> Aproveitamento</div>
              <p className="text-2xl font-bold mt-1">
                {planoCorte.length > 0
                  ? Math.round(planoCorte.reduce((s, g) => s + g.otimizacao.aproveitamento_medio, 0) / planoCorte.length)
                  : 0}%
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Box className="h-4 w-4" /> Vidro</div>
              <p className="text-2xl font-bold mt-1">{vidros.reduce((s, v) => s + v.area_m2, 0).toFixed(2)} m²</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><BarChart3 className="h-4 w-4" /> Ferragens</div>
              <p className="text-2xl font-bold mt-1">{ferragens.length} itens</p>
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

          {/* Plano de corte por perfil */}
          {planoCorte.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">4. Plano de Corte por Perfil (Barra 6000mm — Kerf: 3mm/corte)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {planoCorte.map((grupo, gi) => (
                  <div key={gi} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-mono font-bold text-primary text-sm">{grupo.perfil_codigo}</span>
                        <span className="text-sm text-muted-foreground ml-2">{grupo.perfil_nome}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{grupo.otimizacao.total_barras} barra(s)</Badge>
                        <Badge variant="secondary">{grupo.otimizacao.aproveitamento_medio}% uso</Badge>
                        <Badge variant="outline" className="text-orange-600">Sobra: {grupo.otimizacao.sobra_total_mm}mm</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {grupo.otimizacao.barras.map((barra, bi) => (
                        <div key={bi} className="bg-muted/30 rounded p-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span className="font-semibold">Barra {bi + 1}</span>
                            <span>{barra.aproveitamento_pct}% | Sobra {barra.sobra_mm}mm</span>
                          </div>
                          <div className="h-6 bg-muted rounded flex overflow-hidden">
                            {barra.cortes.map((c, ci) => {
                              const pct = (c.comprimento / 6000) * 100;
                              const colors = ['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                              return (
                                <div
                                  key={ci}
                                  className={`${colors[ci % colors.length]} flex items-center justify-center text-[9px] text-white font-bold border-r border-background`}
                                  style={{ width: `${pct}%` }}
                                  title={`${c.posicao} — ${c.comprimento}mm`}
                                >
                                  {c.comprimento > 400 ? `${c.comprimento}` : ''}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {barra.cortes.map((c, ci) => (
                              <span key={ci} className="text-[10px] text-muted-foreground">
                                {c.posicao} ({c.comprimento}mm){ci < barra.cortes.length - 1 ? ' + ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Vidros */}
          {vidros.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">5. Cálculo de Vidros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Largura (mm)</TableHead>
                        <TableHead className="text-right">Altura (mm)</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Área Total (m²)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vidros.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell>{v.descricao}</TableCell>
                          <TableCell className="text-right font-mono">{v.largura_mm}</TableCell>
                          <TableCell className="text-right font-mono">{v.altura_mm}</TableCell>
                          <TableCell className="text-right font-bold">{v.quantidade}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{v.area_m2} m²</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ferragens e Materiais */}
          {(ferragens.length > 0 || materiaisAux.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ferragens.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">6. Lista de Ferragens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {ferragens.map((f, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <div>
                            <span className="text-sm">{f.nome}</span>
                            {f.observacao && <span className="text-xs text-muted-foreground ml-1">({f.observacao})</span>}
                          </div>
                          <div className="flex items-center gap-1 font-bold text-sm">
                            <span className="text-primary">{f.quantidade}</span>
                            <span className="text-muted-foreground text-xs">{f.unidade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {materiaisAux.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">7. Materiais Auxiliares</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {materiaisAux.map((m, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <div>
                            <span className="text-sm">{m.nome}</span>
                            {m.observacao && <span className="text-xs text-muted-foreground ml-1">({m.observacao})</span>}
                          </div>
                          <div className="flex items-center gap-1 font-bold text-sm">
                            <span className="text-primary">{m.quantidade}</span>
                            <span className="text-muted-foreground text-xs">{m.unidade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
