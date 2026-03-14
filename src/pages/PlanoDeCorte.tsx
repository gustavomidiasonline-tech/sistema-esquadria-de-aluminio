import { AppLayout } from "@/components/AppLayout";
import { useState, useMemo } from "react";
import { Plus, ArrowLeft, Printer, Save, Search, Download } from "lucide-react";
import { exportListaCortePDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfileCuttingTable } from "@/components/plano-de-corte/ProfileCuttingTable";
import { ProductThumbnail } from "@/components/plano-de-corte/ProductThumbnail";
import { produtosEsquadria, type PerfilCorte } from "@/data/perfis-aluminio";
import { toast } from "sonner";

/** Recalcula as medidas dos perfis proporcionalmente às novas dimensões */
function recalcularPerfis(
  perfisOrigem: PerfilCorte[],
  larguraOriginal: number,
  alturaOriginal: number,
  novaLargura: number,
  novaAltura: number
): PerfilCorte[] {
  const ratioL = novaLargura / larguraOriginal;
  const ratioA = novaAltura / alturaOriginal;

  return perfisOrigem.map((p) => {
    let novaMedida = p.medida;
    if (p.posicao === "Altura") {
      novaMedida = Math.round(p.medida * ratioA);
    } else if (p.posicao === "Largura" || p.posicao === "Travessa") {
      novaMedida = Math.round(p.medida * ratioL);
    } else if (p.posicao === "Montante") {
      novaMedida = Math.round(p.medida * ratioA);
    } else if (p.posicao === "Diagonal") {
      novaMedida = Math.round(p.medida * Math.sqrt((ratioL ** 2 + ratioA ** 2) / 2));
    }
    return { ...p, medida: novaMedida };
  });
}

interface PlanoItem {
  id: number;
  produtoId: number;
  largura: number;
  altura: number;
  descricao: string;
  criadoPor: string;
  data: string;
}

const mockPlanos: PlanoItem[] = [
  { id: 1, produtoId: 1, largura: 2000, altura: 1000, descricao: "", criadoPor: "Fabio", data: "11/01/2022" },
  { id: 2, produtoId: 2, largura: 2400, altura: 1200, descricao: "", criadoPor: "Odair Araújo", data: "21/02/2022" },
  { id: 3, produtoId: 7, largura: 610, altura: 560, descricao: "", criadoPor: "Fabio", data: "11/01/2022" },
  { id: 4, produtoId: 7, largura: 575, altura: 585, descricao: "", criadoPor: "Fabio", data: "11/01/2022" },
  { id: 5, produtoId: 3, largura: 1200, altura: 2200, descricao: "", criadoPor: "Fabio", data: "11/01/2022" },
  { id: 6, produtoId: 7, largura: 590, altura: 1810, descricao: "", criadoPor: "Fabio", data: "11/01/2022" },
  { id: 7, produtoId: 8, largura: 2115, altura: 1945, descricao: "", criadoPor: "Fabio", data: "11/01/2022" },
  { id: 8, produtoId: 9, largura: 1450, altura: 1070, descricao: "", criadoPor: "Fabio", data: "11/01/2022" },
  { id: 9, produtoId: 5, largura: 278, altura: 785, descricao: "", criadoPor: "Norma G Silva Barbosa", data: "11/01/2022" },
  { id: 10, produtoId: 10, largura: 1160, altura: 793, descricao: "", criadoPor: "Odair Araújo", data: "21/02/2022" },
];

const PlanoDeCorte = () => {
  const [search, setSearch] = useState("");
  const [planos, setPlanos] = useState(mockPlanos);
  const [selectedPlano, setSelectedPlano] = useState<PlanoItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Dialog state
  const [selectedProdutoId, setSelectedProdutoId] = useState<number | null>(null);
  const [novoAltura, setNovoAltura] = useState("");
  const [novoLargura, setNovoLargura] = useState("");
  const [novoDescricao, setNovoDescricao] = useState("");

  // Detail edit state
  const [editLargura, setEditLargura] = useState("");
  const [editAltura, setEditAltura] = useState("");

  const filtered = planos.filter((p) => {
    const produto = produtosEsquadria.find(pr => pr.id === p.produtoId);
    const nome = produto?.nome || "";
    return nome.toLowerCase().includes(search.toLowerCase()) || p.criadoPor.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelectPlano = (plano: PlanoItem) => {
    setSelectedPlano(plano);
    setEditLargura(String(plano.largura));
    setEditAltura(String(plano.altura));
  };

  const handleCriarPlano = () => {
    if (!selectedProdutoId) {
      toast.error("Selecione um produto");
      return;
    }
    if (!novoAltura || !novoLargura) {
      toast.error("Informe altura e largura");
      return;
    }

    const hoje = new Date();
    const dataStr = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;

    const novo: PlanoItem = {
      id: Date.now(),
      produtoId: selectedProdutoId,
      largura: Number(novoLargura),
      altura: Number(novoAltura),
      descricao: novoDescricao,
      criadoPor: "Usuário",
      data: dataStr,
    };

    setPlanos(prev => [novo, ...prev]);
    setDialogOpen(false);
    setSelectedProdutoId(null);
    setNovoAltura("");
    setNovoLargura("");
    setNovoDescricao("");
    toast.success("Plano de corte adicionado!");
  };

  const getProduto = (id: number) => produtosEsquadria.find(p => p.id === id);

  // ============ DETAIL VIEW ============
  if (selectedPlano) {
    const produto = getProduto(selectedPlano.produtoId);
    const newL = Number(editLargura) || selectedPlano.largura;
    const newA = Number(editAltura) || selectedPlano.altura;
    const dimensionsChanged = produto && (newL !== produto.largura || newA !== produto.altura);

    // Recalculate perfis based on new dimensions
    const recalculatedPerfis = produto
      ? recalcularPerfis(produto.perfis, produto.largura, produto.altura, newL, newA)
      : [];

    const handleSalvar = () => {
      setPlanos(prev => prev.map(p =>
        p.id === selectedPlano.id
          ? { ...p, largura: newL, altura: newA }
          : p
      ));
      setSelectedPlano({ ...selectedPlano, largura: newL, altura: newA });
      toast.success("Dimensões salvas e perfis recalculados!");
    };

    return (
      <AppLayout>
        <div className="max-w-7xl space-y-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setSelectedPlano(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Button className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>

          {/* Product header */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-start gap-6">
              {produto && (
                <ProductThumbnail tipo={produto.tipo} folhas={produto.folhas} className="w-32 h-28" />
              )}
              <div className="flex-1 space-y-4">
                <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
                  {produto?.nome || "Produto"}
                </h2>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">Largura</Label>
                    <Input
                      type="number"
                      value={editLargura}
                      onChange={(e) => setEditLargura(e.target.value)}
                      className="mt-1 bg-muted/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">Altura</Label>
                    <Input
                      type="number"
                      value={editAltura}
                      onChange={(e) => setEditAltura(e.target.value)}
                      className="mt-1 bg-muted/50"
                    />
                  </div>
                </div>
                {dimensionsChanged && (
                  <p className="text-xs text-primary font-medium animate-pulse">
                    ⚡ Dimensões alteradas — perfis recalculados automaticamente
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile cutting table with recalculated perfis */}
          {produto && (
            <ProfileCuttingTable
              perfis={recalculatedPerfis}
              produtoNome={produto.nome}
              largura={newL}
              altura={newA}
              showHeader={false}
            />
          )}

          {/* Save button */}
          <div className="flex justify-end mt-4">
            <Button className="gap-2" onClick={handleSalvar}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ============ LIST VIEW ============
  return (
    <AppLayout>
      <div className="max-w-7xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plano de Corte</h1>
            <p className="text-sm text-muted-foreground">Gerencie os planos de corte dos produtos</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" placeholder="Buscar por produto ou responsável..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Product cards grid - 2 columns like reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((plano) => {
            const produto = getProduto(plano.produtoId);
            if (!produto) return null;

            return (
              <button
                key={plano.id}
                onClick={() => handleSelectPlano(plano)}
                className="bg-card border border-border rounded-xl p-4 text-left hover:shadow-md hover:border-primary/40 transition-all flex items-center gap-4"
              >
                {/* Thumbnail */}
                <ProductThumbnail tipo={produto.tipo} folhas={produto.folhas} className="w-20 h-16" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground uppercase leading-tight">
                    {produto.nome}
                  </p>
                  <p className="text-xs font-medium text-primary mt-0.5">
                    {plano.criadoPor} {plano.data}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    L: {plano.largura} X A: {plano.altura}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ ADD DIALOG ============ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Plano de Corte</DialogTitle>
            <DialogDescription>Selecione o produto e informe as dimensões.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Product selection grid */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Selecione o Produto</Label>
              <div className="grid grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-1">
                {produtosEsquadria.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => setSelectedProdutoId(produto.id)}
                    className={`border rounded-xl p-3 flex flex-col items-center gap-2 transition-all text-center
                      ${selectedProdutoId === produto.id
                        ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                      }`}
                  >
                    <ProductThumbnail tipo={produto.tipo} folhas={produto.folhas} className="w-16 h-14" />
                    <span className="text-[11px] font-semibold text-foreground uppercase leading-tight">
                      {produto.nome}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dimension inputs */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">
                  Altura:<span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={novoAltura}
                  onChange={(e) => setNovoAltura(e.target.value)}
                  className="mt-1 bg-muted/30"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">
                  Largura:<span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="2000"
                  value={novoLargura}
                  onChange={(e) => setNovoLargura(e.target.value)}
                  className="mt-1 bg-muted/30"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Descrição:</Label>
                <Textarea
                  placeholder="Descrição opcional..."
                  value={novoDescricao}
                  onChange={(e) => setNovoDescricao(e.target.value)}
                  className="mt-1 bg-muted/30 min-h-[60px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Voltar</Button>
            <Button onClick={handleCriarPlano}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PlanoDeCorte;
