import { AppLayout } from "@/components/AppLayout";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseQuery, useSupabaseInsert } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const EmissaoNF = () => {
  const { user } = useAuth();
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const insertMutation = useSupabaseInsert("notas_fiscais");
  const [form, setForm] = useState({ cliente_id: "", tipo: "nfe", valor: "", descricao: "", numero: "" });

  const handleEmitir = async () => {
    if (!form.valor || !form.cliente_id) { toast.error("Preencha cliente e valor"); return; }
    try {
      await insertMutation.mutateAsync({
        cliente_id: form.cliente_id,
        tipo: form.tipo,
        valor: Number(form.valor),
        descricao: form.descricao,
        numero: form.numero || null,
        data_emissao: new Date().toISOString().split("T")[0],
        status: "emitida",
        created_by: user?.id,
      });
      toast.success("Nota fiscal emitida com sucesso!");
      setForm({ cliente_id: "", tipo: "nfe", valor: "", descricao: "", numero: "" });
    } catch {}
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emissão de Nota Fiscal</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados para emitir uma nova NF</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Cliente / Destinatário <span className="text-destructive">*</span></Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c: Tables<"clientes">) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número da NF</Label>
              <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="mt-1" placeholder="Ex: 000123" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nfe">NF-e (Produto)</SelectItem>
                  <SelectItem value="nfse">NFS-e (Serviço)</SelectItem>
                  <SelectItem value="nfce">NFC-e (Consumidor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Total (R$) <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="mt-1" placeholder="0,00" />
            </div>
          </div>
          <div>
            <Label>Descrição dos Itens</Label>
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" placeholder="Descreva os produtos ou serviços..." rows={4} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setForm({ cliente_id: "", tipo: "nfe", valor: "", descricao: "", numero: "" })}>Limpar</Button>
            <Button className="gap-2" onClick={handleEmitir} disabled={insertMutation.isPending}>
              <FilePlus className="h-4 w-4" /> {insertMutation.isPending ? "Emitindo..." : "Emitir Nota Fiscal"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EmissaoNF;
