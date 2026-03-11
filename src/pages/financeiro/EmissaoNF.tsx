import { AppLayout } from "@/components/AppLayout";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const EmissaoNF = () => (
  <AppLayout>
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Emissão de Nota Fiscal</h1>
        <p className="text-sm text-muted-foreground">Preencha os dados para emitir uma nova NF-e</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Cliente / Destinatário</Label>
            <Input placeholder="Nome ou razão social" />
          </div>
          <div>
            <Label>CPF / CNPJ</Label>
            <Input placeholder="000.000.000-00" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Tipo</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nfe">NF-e (Produto)</SelectItem>
                <SelectItem value="nfse">NFS-e (Serviço)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor Total (R$)</Label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div>
            <Label>Natureza da Operação</Label>
            <Input placeholder="Venda de mercadoria" />
          </div>
        </div>
        <div>
          <Label>Descrição dos Itens</Label>
          <Textarea placeholder="Descreva os produtos ou serviços..." rows={4} />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancelar</Button>
          <Button className="gap-2"><FilePlus className="h-4 w-4" /> Emitir Nota Fiscal</Button>
        </div>
      </div>
    </div>
  </AppLayout>
);

export default EmissaoNF;
