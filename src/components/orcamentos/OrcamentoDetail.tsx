import { useState } from "react";
import { ChevronDown, ChevronUp, Ruler, Square, Weight, Package, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { perfisAluminio } from "@/data/perfis-aluminio";

interface OrcamentoItem {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  largura?: number | null;
  altura?: number | null;
  produto_id?: string | null;
}

interface OrcamentoDetailProps {
  orcamento: any;
  itens: OrcamentoItem[];
  onDeleteItem?: (id: string) => void;
}

export function OrcamentoDetail({ orcamento, itens, onDeleteItem }: OrcamentoDetailProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const calcGlassM2 = (largura: number | null | undefined, altura: number | null | undefined) => {
    if (!largura || !altura) return null;
    // Convert mm to m and calculate area
    const m2 = (largura / 1000) * (altura / 1000);
    return m2;
  };

  const calcPerimeter = (largura: number | null | undefined, altura: number | null | undefined) => {
    if (!largura || !altura) return null;
    return ((largura + altura) * 2) / 1000; // in meters
  };

  const getProfilesForItem = (descricao: string) => {
    // Try to match profiles based on description keywords
    const desc = descricao.toLowerCase();
    const matched = perfisAluminio.filter((p) =>
      p.aplicacao.some((a) => {
        const app = a.toLowerCase();
        return desc.includes("correr") && app.includes("correr") ||
          desc.includes("basculante") && app.includes("basculante") ||
          desc.includes("maxim") && app.includes("maxim") ||
          desc.includes("pivotante") && app.includes("pivotante") ||
          desc.includes("porta") && app.includes("porta") ||
          desc.includes("janela") && app.includes("janela");
      })
    );
    return matched.slice(0, 6); // limit to 6 profiles
  };

  const totalM2 = itens.reduce((sum, item) => {
    const m2 = calcGlassM2(item.largura, item.altura);
    return sum + (m2 ? m2 * item.quantidade : 0);
  }, 0);

  const totalWeight = itens.reduce((sum, item) => {
    const perim = calcPerimeter(item.largura, item.altura);
    const profiles = getProfilesForItem(item.descricao);
    if (!perim || profiles.length === 0) return sum;
    const avgWeight = profiles.reduce((s, p) => s + p.peso, 0) / profiles.length;
    return sum + (perim * avgWeight * item.quantidade);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">Itens</span>
          </div>
          <p className="text-lg font-bold text-foreground">{itens.length}</p>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Square className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-medium text-muted-foreground">Vidro total</span>
          </div>
          <p className="text-lg font-bold text-foreground">{totalM2.toFixed(2)} m²</p>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Weight className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-medium text-muted-foreground">Peso est.</span>
          </div>
          <p className="text-lg font-bold text-foreground">{totalWeight.toFixed(1)} kg</p>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Ruler className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-medium text-muted-foreground">Valor total</span>
          </div>
          <p className="text-lg font-bold text-primary">{fmt(itens.reduce((s, i) => s + i.valor_total, 0))}</p>
        </div>
      </div>

      {/* Items table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground w-8"></th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Item</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Dimensões</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">m² vidro</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Qtd</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Unit.</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Total</th>
              {onDeleteItem && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {itens.map((item, idx) => {
              const isExpanded = expandedItem === item.id;
              const m2 = calcGlassM2(item.largura, item.altura);
              const profiles = getProfilesForItem(item.descricao);

              return (
                <>
                  <tr
                    key={item.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors cursor-pointer",
                      isExpanded && "bg-muted/20"
                    )}
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  >
                    <td className="px-4 py-3">
                      {profiles.length > 0 && (
                        isExpanded
                          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-xs">{item.descricao}</p>
                      {profiles.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">{profiles.length} perfis · {profiles[0]?.linha}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.largura && item.altura ? (
                        <span className="text-xs text-foreground font-mono">
                          {item.largura} × {item.altura} mm
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m2 ? (
                        <span className="text-xs font-medium text-blue-600">{(m2 * item.quantidade).toFixed(2)}</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium text-foreground">{item.quantidade}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-foreground">{fmt(item.valor_unitario)}</td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-primary">{fmt(item.valor_total)}</td>
                    {onDeleteItem && (
                      <td className="px-2 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                          className="h-7 w-7 rounded flex items-center justify-center hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </td>
                    )}
                  </tr>

                  {/* Expanded: Profile details */}
                  {isExpanded && profiles.length > 0 && (
                    <tr key={`${item.id}-detail`}>
                      <td colSpan={onDeleteItem ? 8 : 7} className="px-4 py-3 bg-muted/10">
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold text-foreground mb-2">Perfis técnicos</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {profiles.map((perfil) => (
                              <div
                                key={perfil.codigo}
                                className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-lg"
                              >
                                {/* Profile visual */}
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                                  <div
                                    className="bg-primary/60 rounded-sm"
                                    style={{
                                      width: `${Math.min(Math.max(perfil.largura / 5, 8), 32)}px`,
                                      height: `${Math.min(Math.max(perfil.altura / 3, 6), 32)}px`,
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-primary">{perfil.codigo}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium text-muted-foreground">{perfil.tipo}</span>
                                  </div>
                                  <p className="text-[10px] text-foreground truncate">{perfil.descricao}</p>
                                  <p className="text-[9px] text-muted-foreground">
                                    {perfil.largura}×{perfil.altura}mm · {perfil.espessura}mm · {perfil.peso} kg/m
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Glass calculation */}
                          {m2 && (
                            <div className="mt-2 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Square className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[11px] font-semibold text-foreground">Cálculo do vidro</span>
                              </div>
                              <div className="mt-1 grid grid-cols-3 gap-4 text-[10px]">
                                <div>
                                  <span className="text-muted-foreground">Dimensão:</span>
                                  <span className="ml-1 font-medium text-foreground">{item.largura} × {item.altura} mm</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Área unitária:</span>
                                  <span className="ml-1 font-medium text-blue-600">{m2.toFixed(3)} m²</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total ({item.quantidade}x):</span>
                                  <span className="ml-1 font-bold text-blue-600">{(m2 * item.quantidade).toFixed(3)} m²</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {/* Totals footer */}
        <div className="border-t border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[11px] text-muted-foreground">
            <span>{itens.length} {itens.length === 1 ? "item" : "itens"}</span>
            {totalM2 > 0 && <span>{totalM2.toFixed(2)} m² de vidro</span>}
            {totalWeight > 0 && <span>~{totalWeight.toFixed(1)} kg</span>}
          </div>
          <p className="text-sm font-bold text-primary">
            {fmt(itens.reduce((s, i) => s + i.valor_total, 0))}
          </p>
        </div>
      </div>
    </div>
  );
}
