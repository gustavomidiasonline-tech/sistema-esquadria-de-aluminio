import { useState } from "react";
import { ChevronDown, ChevronUp, Ruler, Square, Weight, Package, Trash2, TrendingUp, Layers, Wrench, Clock, Settings2 } from "lucide-react";
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
  custo_aluminio?: number | null;
  custo_vidro?: number | null;
  custo_ferragem?: number | null;
  custo_acessorios?: number | null;
  custo_mao_obra?: number | null;
  custo_total?: number | null;
  markup_percentual?: number | null;
  lucro?: number | null;
  peso_total_kg?: number | null;
  area_vidro_m2?: number | null;
  tipo_vidro?: string | null;
}

interface OrcamentoDetailProps {
  orcamento: any;
  itens: OrcamentoItem[];
  onDeleteItem?: (id: string) => void;
}

const VIDRO_LABELS: Record<string, string> = {
  temperado_6mm: "Temperado 6mm",
  temperado_8mm: "Temperado 8mm",
  temperado_10mm: "Temperado 10mm",
  laminado_8mm: "Laminado 8mm",
  comum_4mm: "Comum 4mm",
};

export function OrcamentoDetail({ orcamento, itens, onDeleteItem }: OrcamentoDetailProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const calcGlassM2 = (largura: number | null | undefined, altura: number | null | undefined) => {
    if (!largura || !altura) return null;
    return (largura / 1000) * (altura / 1000);
  };

  const getProfilesForItem = (descricao: string) => {
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
    return matched.slice(0, 6);
  };

  const hasCostData = (item: OrcamentoItem) =>
    (item.custo_aluminio ?? 0) > 0 || (item.custo_vidro ?? 0) > 0 || (item.custo_ferragem ?? 0) > 0;

  // Aggregated totals from cost data
  const totals = itens.reduce(
    (acc, item) => ({
      aluminio: acc.aluminio + (item.custo_aluminio ?? 0),
      vidro: acc.vidro + (item.custo_vidro ?? 0),
      ferragem: acc.ferragem + (item.custo_ferragem ?? 0),
      acessorios: acc.acessorios + (item.custo_acessorios ?? 0),
      maoObra: acc.maoObra + (item.custo_mao_obra ?? 0),
      custo: acc.custo + (item.custo_total ?? 0),
      lucro: acc.lucro + (item.lucro ?? 0),
      peso: acc.peso + (item.peso_total_kg ?? 0),
      vidroM2: acc.vidroM2 + (item.area_vidro_m2 ?? 0),
      venda: acc.venda + item.valor_total,
    }),
    { aluminio: 0, vidro: 0, ferragem: 0, acessorios: 0, maoObra: 0, custo: 0, lucro: 0, peso: 0, vidroM2: 0, venda: 0 }
  );

  const hasTotalCosts = totals.custo > 0;

  const totalM2 = hasTotalCosts
    ? totals.vidroM2
    : itens.reduce((sum, item) => {
        const m2 = calcGlassM2(item.largura, item.altura);
        return sum + (m2 ? m2 * item.quantidade : 0);
      }, 0);

  const totalWeight = hasTotalCosts
    ? totals.peso
    : itens.reduce((sum, item) => {
        const profiles = getProfilesForItem(item.descricao);
        const perim = item.largura && item.altura ? ((item.largura + item.altura) * 2) / 1000 : 0;
        if (!perim || profiles.length === 0) return sum;
        const avgWeight = profiles.reduce((s, p) => s + p.peso, 0) / profiles.length;
        return sum + perim * avgWeight * item.quantidade;
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
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-medium text-muted-foreground">Valor total</span>
          </div>
          <p className="text-lg font-bold text-primary">{fmt(totals.venda)}</p>
        </div>
      </div>

      {/* Cost breakdown bar (aggregated) */}
      {hasTotalCosts && (
        <div className="border border-border rounded-xl p-4 bg-card space-y-3">
          <p className="text-xs font-semibold text-foreground">Breakdown de custos total</p>
          {/* Visual bar */}
          <div className="h-3 rounded-full overflow-hidden flex bg-muted">
            {[
              { val: totals.aluminio, color: "bg-amber-500" },
              { val: totals.vidro, color: "bg-blue-500" },
              { val: totals.ferragem, color: "bg-orange-500" },
              { val: totals.acessorios, color: "bg-purple-500" },
              { val: totals.maoObra, color: "bg-cyan-500" },
              { val: totals.lucro, color: "bg-emerald-500" },
            ].map((seg, i) => {
              const pct = totals.venda > 0 ? (seg.val / totals.venda) * 100 : 0;
              return pct > 0 ? (
                <div key={i} className={cn(seg.color, "transition-all")} style={{ width: `${pct}%` }} />
              ) : null;
            })}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: "Alumínio", val: totals.aluminio, color: "bg-amber-500", icon: <Weight className="h-3 w-3" /> },
              { label: "Vidro", val: totals.vidro, color: "bg-blue-500", icon: <Layers className="h-3 w-3" /> },
              { label: "Ferragem", val: totals.ferragem, color: "bg-orange-500", icon: <Wrench className="h-3 w-3" /> },
              { label: "Acessórios", val: totals.acessorios, color: "bg-purple-500", icon: <Settings2 className="h-3 w-3" /> },
              { label: "Mão de obra", val: totals.maoObra, color: "bg-cyan-500", icon: <Clock className="h-3 w-3" /> },
              { label: "Lucro", val: totals.lucro, color: "bg-emerald-500", icon: <TrendingUp className="h-3 w-3" /> },
            ].map((seg) => (
              <div key={seg.label} className="flex items-center gap-1.5">
                <div className={cn("h-2.5 w-2.5 rounded-sm shrink-0", seg.color)} />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">{seg.label}</p>
                  <p className="text-xs font-semibold text-foreground">{fmt(seg.val)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground w-8"></th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Item</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Dimensões</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Qtd</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Custo</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Lucro</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Total</th>
              {onDeleteItem && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {itens.map((item) => {
              const isExpanded = expandedItem === item.id;
              const m2 = calcGlassM2(item.largura, item.altura);
              const profiles = getProfilesForItem(item.descricao);
              const hasBreakdown = hasCostData(item);
              const canExpand = hasBreakdown || profiles.length > 0;

              return (
                <>
                  <tr
                    key={item.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      canExpand && "cursor-pointer",
                      isExpanded && "bg-muted/20"
                    )}
                    onClick={() => canExpand && setExpandedItem(isExpanded ? null : item.id)}
                  >
                    <td className="px-4 py-3">
                      {canExpand && (
                        isExpanded
                          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-xs">{item.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.tipo_vidro && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded font-medium">
                            {VIDRO_LABELS[item.tipo_vidro] || item.tipo_vidro}
                          </span>
                        )}
                        {item.markup_percentual && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium">
                            +{item.markup_percentual}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.largura && item.altura ? (
                        <span className="text-xs text-foreground font-mono">
                          {item.largura} × {item.altura}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium text-foreground">{item.quantidade}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {(item.custo_total ?? 0) > 0 ? fmt(item.custo_total!) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-emerald-600 font-medium">
                      {(item.lucro ?? 0) > 0 ? fmt(item.lucro!) : "—"}
                    </td>
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

                  {/* Expanded detail */}
                  {isExpanded && (
                    <tr key={`${item.id}-detail`}>
                      <td colSpan={onDeleteItem ? 8 : 7} className="px-4 py-3 bg-muted/10">
                        <div className="space-y-3">

                          {/* Cost breakdown per item */}
                          {hasBreakdown && (
                            <div className="p-3 border border-border rounded-lg bg-card">
                              <p className="text-[11px] font-semibold text-foreground mb-2">Composição de custo</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                                {[
                                  { label: "Alumínio", val: item.custo_aluminio, color: "text-amber-600", icon: <Weight className="h-3 w-3 text-amber-500" /> },
                                  { label: "Vidro", val: item.custo_vidro, color: "text-blue-600", icon: <Layers className="h-3 w-3 text-blue-500" /> },
                                  { label: "Ferragem", val: item.custo_ferragem, color: "text-orange-600", icon: <Wrench className="h-3 w-3 text-orange-500" /> },
                                  { label: "Acessórios", val: item.custo_acessorios, color: "text-purple-600", icon: <Settings2 className="h-3 w-3 text-purple-500" /> },
                                  { label: "Mão de obra", val: item.custo_mao_obra, color: "text-cyan-600", icon: <Clock className="h-3 w-3 text-cyan-500" /> },
                                  { label: "Custo total", val: item.custo_total, color: "text-foreground font-bold", icon: <Package className="h-3 w-3 text-muted-foreground" /> },
                                  { label: "Lucro", val: item.lucro, color: "text-emerald-600 font-bold", icon: <TrendingUp className="h-3 w-3 text-emerald-500" /> },
                                ].map((c) => (
                                  <div key={c.label} className="space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      {c.icon}
                                      <span className="text-[10px] text-muted-foreground">{c.label}</span>
                                    </div>
                                    <p className={cn("text-xs", c.color)}>
                                      {(c.val ?? 0) > 0 ? fmt(c.val!) : "—"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {/* Extra info row */}
                              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
                                {(item.peso_total_kg ?? 0) > 0 && (
                                  <span>Peso: <b className="text-foreground">{item.peso_total_kg!.toFixed(2)} kg</b></span>
                                )}
                                {(item.area_vidro_m2 ?? 0) > 0 && (
                                  <span>Vidro: <b className="text-blue-600">{item.area_vidro_m2!.toFixed(3)} m²</b></span>
                                )}
                                {item.markup_percentual && (
                                  <span>Markup: <b className="text-emerald-600">{item.markup_percentual}%</b></span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Profile details */}
                          {profiles.length > 0 && (
                            <>
                              <p className="text-[11px] font-semibold text-foreground">Perfis técnicos</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {profiles.map((perfil) => (
                                  <div
                                    key={perfil.codigo}
                                    className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-lg"
                                  >
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
                            </>
                          )}

                          {/* Glass calculation fallback */}
                          {!hasBreakdown && m2 && (
                            <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
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
            {hasTotalCosts && <span>Lucro: <b className="text-emerald-600">{fmt(totals.lucro)}</b></span>}
          </div>
          <p className="text-sm font-bold text-primary">{fmt(totals.venda)}</p>
        </div>
      </div>
    </div>
  );
}
