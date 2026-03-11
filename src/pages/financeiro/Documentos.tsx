import { AppLayout } from "@/components/AppLayout";
import { FileText, Download, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockDocs = [
  { id: 1, nome: "Alvará de funcionamento 2026", tipo: "Licença", data: "01/01/2026", tamanho: "245 KB" },
  { id: 2, nome: "Contrato social - Alumy LTDA", tipo: "Jurídico", data: "15/06/2024", tamanho: "1.2 MB" },
  { id: 3, nome: "Certificado INMETRO - Vidros", tipo: "Certificação", data: "20/08/2025", tamanho: "890 KB" },
  { id: 4, nome: "Seguro responsabilidade civil", tipo: "Seguro", data: "01/03/2026", tamanho: "320 KB" },
  { id: 5, nome: "Laudo técnico - Fachada Ana Costa", tipo: "Laudo", data: "10/03/2026", tamanho: "1.8 MB" },
];

const Documentos = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm text-muted-foreground">Documentos e arquivos da empresa</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Upload documento</Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
        {mockDocs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-accent/50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{doc.nome}</p>
                <p className="text-xs text-muted-foreground">{doc.data} · {doc.tamanho}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{doc.tipo}</Badge>
              <button className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Documentos;
