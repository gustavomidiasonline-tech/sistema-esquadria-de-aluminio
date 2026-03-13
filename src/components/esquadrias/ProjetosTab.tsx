import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Eye, Printer } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";

export function ProjetosTab() {
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: projetos, isLoading } = useQuery({
    queryKey: ["projetos_esquadria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos_esquadria")
        .select("*, modelos_esquadria(nome, tipo, categoria), clientes(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: listaCorte } = useQuery({
    queryKey: ["lista_corte", detailId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lista_corte").select("*").eq("projeto_id", detailId!);
      if (error) throw error;
      return data;
    },
    enabled: !!detailId,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projetos_esquadria").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos_esquadria"] });
      toast.success("Projeto excluído!");
    },
  });

  if (isLoading) return <p className="text-muted-foreground p-4 mt-4">Carregando...</p>;

  const selectedProjeto = projetos?.find((p) => p.id === detailId);

  return (
    <div className="space-y-4 mt-4">
      {projetos && projetos.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum projeto salvo. Use o Configurador para criar um projeto.</p>
        </Card>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dimensões</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projetos?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{(p as any).modelos_esquadria?.nome || p.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{(p as any).modelos_esquadria?.categoria}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{p.largura_mm} x {p.altura_mm}</TableCell>
                  <TableCell>{p.quantidade}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(p.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetailId(p.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lista de Corte - {(selectedProjeto as any)?.modelos_esquadria?.nome}</DialogTitle>
            <DialogDescription>
              {selectedProjeto?.largura_mm} x {selectedProjeto?.altura_mm} mm
            </DialogDescription>
          </DialogHeader>

          {listaCorte && listaCorte.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead className="text-right">Corte (mm)</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaCorte.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-bold text-primary">{item.perfil_codigo}</TableCell>
                      <TableCell>{item.perfil_nome}</TableCell>
                      <TableCell><Badge variant="outline">{item.posicao}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{item.comprimento_mm}</TableCell>
                      <TableCell className="text-right font-bold">{item.quantidade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum item na lista de corte.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
