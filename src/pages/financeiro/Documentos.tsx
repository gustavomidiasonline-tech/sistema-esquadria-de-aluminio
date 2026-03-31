import { AppLayout } from "@/components/AppLayout";
import { FileText, Download, Plus, Trash2 } from "lucide-react";
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
import { FileUpload } from "@/components/shared/FileUpload";
import type { Tables } from "@/integrations/supabase/types";

import { BackButton } from "@/components/ui/BackButton";

type DocumentoWithCliente = Tables<"documentos"> & { clientes: { nome: string } | null };

const Documentos = () => {
  const { user } = useAuth();
  const { data: documentos = [], isLoading } = useSupabaseQuery("documentos", {
    select: "*, clientes(nome)",
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const insertMutation = useSupabaseInsert("documentos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo: "", descricao: "", cliente_id: "" });
  const [fileData, setFileData] = useState({ url: "", name: "", size: 0 });

  const handleSave = async () => {
    if (!form.titulo) { toast.error("Preencha o título"); return; }
    try {
      await insertMutation.mutateAsync({
        titulo: form.titulo,
        tipo: form.tipo || null,
        descricao: form.descricao,
        created_by: user?.id,
        arquivo_url: fileData.url || null,
        tamanho_bytes: fileData.size || null,
        cliente_id: form.cliente_id || null,
      });
      toast.success("Documento cadastrado!");
      setDialogOpen(false);
      setForm({ titulo: "", tipo: "", descricao: "", cliente_id: "" });
      setFileData({ url: "", name: "", size: 0 });
    } catch {
      // mutation onError handles toast
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/financeiro" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
              <p className="text-sm text-muted-foreground">{documentos.length} documentos</p>
            </div>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo documento</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : documentos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum documento cadastrado.</div>
        ) : (
          <div className="glass-card-premium divide-y divide-border">
            {documentos.map((doc: DocumentoWithCliente) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${doc.arquivo_url ? "bg-primary/10" : "bg-accent/50"}`}>
                    <FileText className={`h-5 w-5 ${doc.arquivo_url ? "text-primary" : "text-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{doc.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(doc.created_at), "dd/MM/yyyy")}
                      {doc.clientes?.nome && ` · ${doc.clientes.nome}`}
                      {doc.descricao && ` · ${doc.descricao}`}
                      {doc.tamanho_bytes && ` · ${formatSize(doc.tamanho_bytes)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.tipo && <Badge variant="outline">{doc.tipo}</Badge>}
                  {doc.arquivo_url ? (
                    <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer"
                      className="h-8 px-3 rounded-lg border border-border flex items-center gap-1.5 hover:bg-muted transition-colors text-xs font-medium text-foreground">
                      <Download className="h-3.5 w-3.5" /> Baixar
                    </a>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Sem arquivo</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
            <DialogDescription>Cadastre um novo documento e faça upload do arquivo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Cliente</Label>
                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map((c: Tables<"clientes">) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Arquivo</Label>
              <FileUpload
                bucket="documentos"
                folder={user?.id}
                onUploadComplete={(url, name, size) => setFileData({ url, name, size })}
                className="mt-1"
              />
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
