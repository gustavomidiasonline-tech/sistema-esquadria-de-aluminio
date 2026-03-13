import { AppLayout } from "@/components/AppLayout";
import { FileCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseQuery, useSupabaseInsert } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  ativo: { label: "Ativo", variant: "default" },
  encerrado: { label: "Encerrado", variant: "secondary" },
  rascunho: { label: "Rascunho", variant: "outline" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const Contratos = () => {
  const { user } = useAuth();
  const { data: contratos = [], isLoading } = useSupabaseQuery("contratos", {
    select: "*, clientes(nome)",
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const insertMutation = useSupabaseInsert("contratos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", cliente_id: "", valor: "", data_inicio: "", data_fim: "", descricao: "" });

  const handleSave = async () => {
    if (!form.titulo) { toast.error("Preencha o título"); return; }
    try {
      await insertMutation.mutateAsync({
        titulo: form.titulo,
        cliente_id: form.cliente_id || null,
        valor: Number(form.valor) || null,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        descricao: form.descricao,
        created_by: user?.id,
      });
      toast.success("Contrato criado!");
      setDialogOpen(false);
      setForm({ titulo: "", cliente_id: "", valor: "", data_inicio: "", data_fim: "", descricao: "" });
    } catch {}
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
            <p className="text-sm text-muted-foreground">{contratos.length} contratos cadastrados</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo contrato</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : contratos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum contrato cadastrado.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
            {contratos.map((c: any) => {
              const s = statusMap[c.status] || statusMap.rascunho;
              return (
                <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.clientes?.nome || "Sem cliente"}
                        {c.data_inicio && ` · ${format(parseISO(c.data_inicio), "dd/MM/yyyy")}`}
                        {c.data_fim && ` a ${format(parseISO(c.data_fim), "dd/MM/yyyy")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.valor && <span className="text-sm font-bold text-foreground">{fmt(Number(c.valor))}</span>}
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>Crie um novo contrato vinculado a um cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Valor</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="mt-1" /></div>
              <div><Label>Início</Label><Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} className="mt-1" /></div>
              <div><Label>Fim</Label><Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} className="mt-1" /></div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending}>{insertMutation.isPending ? "Salvando..." : "Criar contrato"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Contratos;
