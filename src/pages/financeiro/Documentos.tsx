import { AppLayout } from "@/components/AppLayout";
import { FileText, Download, Plus, Upload } from "lucide-react";
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

const Documentos = () => {
  const { user } = useAuth();
  const { data: documentos = [], isLoading } = useSupabaseQuery("documentos", {
    orderBy: { column: "created_at", ascending: false },
  });
  const insertMutation = useSupabaseInsert("documentos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo: "", descricao: "" });

  const handleSave = async () => {
    if (!form.titulo) { toast.error("Preencha o título"); return; }
    try {
      await insertMutation.mutateAsync({
        titulo: form.titulo,
        tipo: form.tipo || null,
        descricao: form.descricao,
        created_by: user?.id,
      });
      toast.success("Documento cadastrado!");
      setDialogOpen(false);
      setForm({ titulo: "", tipo: "", descricao: "" });
    } catch {}
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
            <p className="text-sm text-muted-foreground">{documentos.length} documentos</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo documento</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : documentos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum documento cadastrado.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
            {documentos.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent/50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{doc.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(doc.created_at), "dd/MM/yyyy")}
                      {doc.descricao && ` · ${doc.descricao}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.tipo && <Badge variant="outline">{doc.tipo}</Badge>}
                  {doc.arquivo_url && (
                    <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
            <DialogDescription>Cadastre um novo documento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Licença">Licença</SelectItem>
                  <SelectItem value="Jurídico">Jurídico</SelectItem>
                  <SelectItem value="Certificação">Certificação</SelectItem>
                  <SelectItem value="Seguro">Seguro</SelectItem>
                  <SelectItem value="Laudo">Laudo</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending}>{insertMutation.isPending ? "Salvando..." : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Documentos;
