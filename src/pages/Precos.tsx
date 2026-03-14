import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Search, Save, RefreshCw, Package, Layers, Wrench, Settings2, Clock, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ConfigRow {
  id: string;
  chave: string;
  valor: number;
  unidade: string | null;
  descricao: string | null;
}

const CATEGORIES: Record<string, { label: string; icon: React.ReactNode; keys: string[] }> = {
  aluminio: {
    label: "Alumínio",
    icon: <Package className="h-4 w-4" />,
    keys: ["preco_kg_aluminio"],
  },
  vidros: {
    label: "Vidros",
    icon: <Layers className="h-4 w-4" />,
    keys: [
      "preco_m2_vidro_temperado_6mm",
      "preco_m2_vidro_temperado_8mm",
      "preco_m2_vidro_temperado_10mm",
      "preco_m2_vidro_laminado_8mm",
      "preco_m2_vidro_comum_4mm",
    ],
  },
  ferragens: {
    label: "Ferragens",
    icon: <Wrench className="h-4 w-4" />,
    keys: [
      "custo_ferragem_janela",
      "custo_ferragem_porta",
      "custo_ferragem_basculante",
      "custo_ferragem_maximar",
      "custo_ferragem_pivotante",
    ],
  },
  acessorios: {
    label: "Acessórios & Markup",
    icon: <Settings2 className="h-4 w-4" />,
    keys: ["custo_acessorios_padrao", "markup_padrao"],
  },
  mao_obra: {
    label: "Mão de Obra",
    icon: <Clock className="h-4 w-4" />,
    keys: [
      "custo_mao_de_obra_hora",
      "horas_producao_janela",
      "horas_producao_porta",
      "horas_instalacao_padrao",
    ],
  },
};

const fmt = (v: number, unidade?: string | null) => {
  if (unidade === "%" || unidade === "horas") return `${v}`;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const Precos = () => {
  const [search, setSearch] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const { data: configRows = [], isLoading } = useQuery({
    queryKey: ["config_precos_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_precos")
        .select("*")
        .order("chave");
      if (error) throw error;
      return (data || []) as ConfigRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: { id: string; valor: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("config_precos")
          .update({ valor: u.valor })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config_precos_admin"] });
      queryClient.invalidateQueries({ queryKey: ["config_precos"] });
      setEditValues({});
      setHasChanges(false);
      toast.success("Preços atualizados com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar preços"),
  });

  const handleChange = (chave: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [chave]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updates = Object.entries(editValues)
      .map(([chave, val]) => {
        const row = configRows.find((r) => r.chave === chave);
        if (!row) return null;
        const num = parseFloat(val.replace(",", "."));
        if (isNaN(num)) return null;
        return { id: row.id, valor: num };
      })
      .filter(Boolean) as { id: string; valor: number }[];

    if (updates.length === 0) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }
    saveMutation.mutate(updates);
  };

  const handleReset = () => {
    setEditValues({});
    setHasChanges(false);
  };

  const getRowsByKeys = (keys: string[]) =>
    configRows
      .filter((r) => keys.includes(r.chave))
      .filter((r) =>
        search === "" ||
        (r.descricao || r.chave).toLowerCase().includes(search.toLowerCase())
      );

  const getValue = (row: ConfigRow) =>
    editValues[row.chave] !== undefined ? editValues[row.chave] : String(row.valor);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4 max-w-4xl">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuração de Preços</h1>
            <p className="text-sm text-muted-foreground">
              Preços base utilizados no cálculo automático de orçamentos
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Desfazer
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar configuração..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vidros">
          <TabsList className="flex-wrap h-auto gap-1">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                {cat.icon} {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <TabsContent key={key} value={key}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {cat.icon} {cat.label}
                  </CardTitle>
                  <CardDescription>
                    Edite os valores abaixo. Eles serão usados automaticamente nos orçamentos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getRowsByKeys(cat.keys).map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {row.descricao || row.chave}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{row.chave}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {row.unidade && (
                            <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded">
                              {row.unidade}
                            </span>
                          )}
                          <div className="relative w-32">
                            {row.unidade?.startsWith("R$") && (
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                R$
                              </span>
                            )}
                            {row.unidade === "%" && (
                              <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={getValue(row)}
                              onChange={(e) => handleChange(row.chave, e.target.value)}
                              className={`text-right font-semibold h-9 ${
                                row.unidade?.startsWith("R$") ? "pl-8" : ""
                              } ${row.unidade === "%" ? "pr-8" : ""} ${
                                editValues[row.chave] !== undefined
                                  ? "border-primary ring-1 ring-primary/30"
                                  : ""
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {getRowsByKeys(cat.keys).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum item encontrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Summary */}
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground text-center">
              💡 Estes valores são a base de cálculo dos orçamentos automáticos.
              Ao alterar, todos os novos orçamentos usarão os valores atualizados.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Precos;
