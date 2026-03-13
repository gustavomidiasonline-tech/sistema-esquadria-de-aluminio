import { AppLayout } from "@/components/AppLayout";
import { Wallet, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseQuery, useSupabaseInsert } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  vencido: { label: "Vencido", variant: "destructive" },
  pago: { label: "Pago", variant: "default" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

const ContasReceber = () => {
  const { user } = useAuth();
  const { data: contas = [], isLoading } = useSupabaseQuery("contas_receber", {
    select: "*, clientes(nome)",
    orderBy: { column: "data_vencimento", ascending: true },
  });
  const insertMutation = useSupabaseInsert("contas_receber");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ descricao: "", valor: "", data_vencimento: "" });

  const handleSave = async () => {
    if (!form.descricao || !form.valor || !form.data_vencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      await insertMutation.mutateAsync({
        descricao: form.descricao,
        valor: Number(form.valor),
        data_vencimento: form.data_vencimento,
        created_by: user?.id,
      });
      toast.success("Conta adicionada!");
      setDialogOpen(false);
      setForm({ descricao: "", valor: "", data_vencimento: "" });
    } catch {}
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-sm text-muted-foreground">{contas.length} contas cadastradas</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Nova conta
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : contas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma conta a receber cadastrada.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
            {contas.map((c: any) => {
              const s = statusMap[c.status] || statusMap.pendente;
              return (
                <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.clientes?.nome || "Sem cliente"}</p>
                      <p className="text-xs text-muted-foreground">{c.descricao} · Venc: {new Date(c.data_vencimento).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
            <DialogTitle>Nova Conta a Receber</DialogTitle>
            <DialogDescription>Cadastre uma nova conta a receber.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Descrição <span className="text-destructive">*</span></Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Valor <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Data de Vencimento <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending}>
              {insertMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ContasReceber;
