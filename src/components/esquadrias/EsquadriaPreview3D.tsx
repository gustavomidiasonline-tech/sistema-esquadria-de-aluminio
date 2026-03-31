/**
 * EsquadriaPreview3D — Visualizador paramétrico estilo Alumy
 *
 * Renderiza esquadrias usando SVG isométrico paramétrico.
 * Suporta:
 *   - Diferentes tipologias (correr, fixo, basculante, maxim-ar, porta)
 *   - Cores de alumínio com seletor visual
 *   - Redimensionamento proporcional (largura × altura)
 *   - Tabs Vidro / Alumínio / Ferragens
 *   - Navegação entre produtos (carousel)
 */

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Color Palette ───────────────────────────────────────────────────

export interface CorAluminio {
  id: string;
  nome: string;
  hex: string;
  /** CSS filter to apply on aluminum profiles */
  filter?: string;
  /** Texture preview swatch (hex or gradient) */
  swatch: string;
}

export const CORES_ALUMINIO: CorAluminio[] = [
  { id: "branco", nome: "Branco", hex: "#f0f0f0", swatch: "#f0f0f0" },
  { id: "fosco", nome: "Branco Fosco", hex: "#e0e0e0", swatch: "#e0e0e0" },
  { id: "bronze", nome: "Bronze", hex: "#8B5E3C", swatch: "#8B5E3C" },
  { id: "marrom", nome: "Marrom", hex: "#5C3317", swatch: "#5C3317" },
  { id: "preto", nome: "Preto", hex: "#2a2a2a", swatch: "#2a2a2a" },
  { id: "preto-fosco", nome: "Preto Fosco", hex: "#1a1a1a", swatch: "#1a1a1a" },
  { id: "chumbo", nome: "Chumbo", hex: "#555555", swatch: "#555555" },
  { id: "grafite", nome: "Grafite", hex: "#444444", swatch: "#444444" },
  { id: "amadeirado", nome: "Amadeirado", hex: "#8B6914", swatch: "linear-gradient(135deg, #a07030, #6b4226)" },
  { id: "champagne", nome: "Champagne", hex: "#d4b896", swatch: "#d4b896" },
  { id: "gold", nome: "Dourado", hex: "#c5a55a", swatch: "#c5a55a" },
  { id: "natural", nome: "Natural", hex: "#c0c0c0", swatch: "#c0c0c0" },
  { id: "verde", nome: "Verde", hex: "#2d5a27", swatch: "#2d5a27" },
  { id: "verde-oliva", nome: "Verde Oliva", hex: "#556B2F", swatch: "#556B2F" },
  { id: "azul", nome: "Azul", hex: "#1e3a5f", swatch: "#1e3a5f" },
  { id: "bege", nome: "Bege", hex: "#d2c6a5", swatch: "#d2c6a5" },
  { id: "areia", nome: "Areia", hex: "#c2b280", swatch: "#c2b280" },
  { id: "amadeirado-escuro", nome: "Amadeirado Escuro", hex: "#5c3d2e", swatch: "linear-gradient(135deg, #6b4226, #3e2114)" },
];

// ─── Types ───────────────────────────────────────────────────────────

export type MaterialTab = "vidro" | "aluminio" | "ferragens";

export interface EsquadriaPreview3DProps {
  /** Window type (correr, fixo, basculante, maximar, porta) */
  tipo: string;
  /** Width in mm */
  largura: number;
  /** Height in mm */
  altura: number;
  /** Number of leaves */
  folhas?: number;
  /** Product name shown in header */
  nome?: string;
  /** Optional product list for carousel navigation */
  produtos?: Array<{ id: string; nome: string; tipo: string; folhas?: number }>;
  /** Currently selected product index */
  produtoIndex?: number;
  /** Callback when carousel navigates */
  onProdutoChange?: (index: number) => void;
  /** Show material tabs */
  showTabs?: boolean;
  /** Callback when color changes */
  onCorChange?: (cor: CorAluminio) => void;
  /** Callback when material tab changes */
  onTabChange?: (tab: MaterialTab) => void;
  /** Optional className */
  className?: string;
}

// ─── SVG Esquadria Renderer ──────────────────────────────────────────

function renderEsquadriaSVG(
  tipo: string,
  largura: number,
  altura: number,
  folhas: number,
  corHex: string,
  vidroOpacity: number = 0.15
): JSX.Element {
  // Normalize to viewBox coordinates (max 400px wide/tall)
  const maxDim = Math.max(largura, altura);
  const scale = 340 / maxDim;
  const w = largura * scale;
  const h = altura * scale;
  const ox = (400 - w) / 2; // center offset x
  const oy = (400 - h) / 2; // center offset y

  const profileW = Math.max(6, w * 0.03); // frame profile width
  const vidroColor = "#a8d4f0";
  const vidroStroke = "#7bb8d9";
  const shadowColor = "rgba(0,0,0,0.08)";

  const t = (tipo || "").toLowerCase().replace(/[-\s]/g, "");

  const elements: JSX.Element[] = [];

  // Background shadow
  elements.push(
    <rect key="shadow" x={ox + 3} y={oy + 3} width={w} height={h} rx={2} fill={shadowColor} />
  );

  // Outer frame
  elements.push(
    <rect key="frame-outer" x={ox} y={oy} width={w} height={h} rx={2}
      fill="none" stroke={corHex} strokeWidth={profileW} />
  );

  if (t.includes("correr") || t === "correr2f" || t === "correr4f") {
    const nf = t === "correr4f" ? 4 : Math.max(2, folhas);
    const leafW = (w - profileW) / nf;

    // Track lines (top and bottom rails)
    elements.push(
      <line key="rail-top" x1={ox + profileW / 2} y1={oy + profileW * 1.5}
        x2={ox + w - profileW / 2} y2={oy + profileW * 1.5}
        stroke={corHex} strokeWidth={2} opacity={0.6} />,
      <line key="rail-bot" x1={ox + profileW / 2} y1={oy + h - profileW * 1.5}
        x2={ox + w - profileW / 2} y2={oy + h - profileW * 1.5}
        stroke={corHex} strokeWidth={2} opacity={0.6} />
    );

    for (let i = 0; i < nf; i++) {
      const lx = ox + profileW / 2 + i * leafW;

      // Glass pane
      elements.push(
        <rect key={`glass-${i}`}
          x={lx + profileW * 0.5} y={oy + profileW * 2}
          width={leafW - profileW} height={h - profileW * 4}
          fill={vidroColor} fillOpacity={vidroOpacity}
          stroke={vidroStroke} strokeWidth={0.5} rx={1} />
      );

      // Leaf frame (inner rectangle)
      elements.push(
        <rect key={`leaf-${i}`}
          x={lx + 2} y={oy + profileW + 2}
          width={leafW - 4} height={h - profileW * 2 - 4}
          fill="none" stroke={corHex} strokeWidth={profileW * 0.6} rx={1} />
      );

      // Handle (small rectangle on leaf edge)
      if (i === 0 || i === nf - 1) {
        const hx = i === 0 ? lx + leafW - profileW : lx + profileW * 0.5;
        elements.push(
          <rect key={`handle-${i}`}
            x={hx - 2} y={oy + h / 2 - 12}
            width={4} height={24}
            fill={corHex} rx={2} opacity={0.8} />
        );
      }

      // Arrow indicator for sliding direction
      const arrowY = oy + h - profileW * 0.5;
      const arrowX = lx + leafW / 2;
      const dir = i % 2 === 0 ? 8 : -8;
      elements.push(
        <path key={`arrow-${i}`}
          d={`M${arrowX - dir},${arrowY} L${arrowX + dir},${arrowY} L${arrowX + dir - 3},${arrowY - 3} M${arrowX + dir},${arrowY} L${arrowX + dir - 3},${arrowY + 3}`}
          fill="none" stroke={corHex} strokeWidth={1.5} opacity={0.4} />
      );
    }
  } else if (t === "fixo") {
    // Fixed window: just frame + glass
    elements.push(
      <rect key="glass"
        x={ox + profileW} y={oy + profileW}
        width={w - profileW * 2} height={h - profileW * 2}
        fill={vidroColor} fillOpacity={vidroOpacity}
        stroke={vidroStroke} strokeWidth={0.5} rx={1} />
    );

    // Cross lines for fixed indicator
    elements.push(
      <line key="diag1" x1={ox + profileW * 2} y1={oy + profileW * 2}
        x2={ox + w - profileW * 2} y2={oy + h - profileW * 2}
        stroke={corHex} strokeWidth={1} opacity={0.15} />,
      <line key="diag2" x1={ox + w - profileW * 2} y1={oy + profileW * 2}
        x2={ox + profileW * 2} y2={oy + h - profileW * 2}
        stroke={corHex} strokeWidth={1} opacity={0.15} />
    );
  } else if (t === "basculante") {
    // Basculante: frame + glass + pivot indicator at top
    elements.push(
      <rect key="glass"
        x={ox + profileW} y={oy + profileW}
        width={w - profileW * 2} height={h - profileW * 2}
        fill={vidroColor} fillOpacity={vidroOpacity}
        stroke={vidroStroke} strokeWidth={0.5} rx={1} />
    );

    // Inner leaf frame
    elements.push(
      <rect key="leaf"
        x={ox + profileW * 1.5} y={oy + profileW * 1.5}
        width={w - profileW * 3} height={h - profileW * 3}
        fill="none" stroke={corHex} strokeWidth={profileW * 0.5} rx={1} />
    );

    // Pivot at top (triangles)
    const cx = ox + w / 2;
    const ty = oy + profileW;
    elements.push(
      <path key="pivot"
        d={`M${cx - 15},${ty + 5} L${cx},${ty - 8} L${cx + 15},${ty + 5}`}
        fill="none" stroke={corHex} strokeWidth={2} opacity={0.5} />
    );

    // Opening arc
    elements.push(
      <path key="arc"
        d={`M${ox + w - profileW * 2},${oy + h - profileW * 2} Q${ox + w / 2},${oy + h * 0.3} ${ox + profileW * 2},${oy + h - profileW * 2}`}
        fill="none" stroke={corHex} strokeWidth={1} opacity={0.2} strokeDasharray="4 4" />
    );
  } else if (t === "maximar" || t === "maximar") {
    // Maxim-ar: multiple horizontal panes
    const nPanes = Math.max(1, Math.floor(altura / 300));
    const paneH = (h - profileW * 2 - (nPanes - 1) * profileW * 0.5) / nPanes;

    for (let i = 0; i < nPanes; i++) {
      const py = oy + profileW + i * (paneH + profileW * 0.5);

      // Glass pane
      elements.push(
        <rect key={`glass-${i}`}
          x={ox + profileW} y={py}
          width={w - profileW * 2} height={paneH}
          fill={vidroColor} fillOpacity={vidroOpacity}
          stroke={vidroStroke} strokeWidth={0.5} rx={1} />
      );

      // Pane frame
      elements.push(
        <rect key={`pane-${i}`}
          x={ox + profileW * 1.3} y={py + 2}
          width={w - profileW * 2.6} height={paneH - 4}
          fill="none" stroke={corHex} strokeWidth={profileW * 0.4} rx={1} />
      );

      // Opening indicator (arc at bottom of each pane)
      if (nPanes > 1) {
        const arcY = py + paneH;
        elements.push(
          <path key={`arc-${i}`}
            d={`M${ox + w * 0.3},${arcY} Q${ox + w / 2},${arcY + 10} ${ox + w * 0.7},${arcY}`}
            fill="none" stroke={corHex} strokeWidth={1} opacity={0.2} strokeDasharray="3 3" />
        );
      }
    }

    // Horizontal dividers (travessas)
    for (let i = 1; i < nPanes; i++) {
      const dy = oy + profileW + i * (paneH + profileW * 0.5) - profileW * 0.25;
      elements.push(
        <rect key={`div-${i}`}
          x={ox + profileW * 0.5} y={dy}
          width={w - profileW} height={profileW * 0.5}
          fill={corHex} rx={1} />
      );
    }
  } else if (t.includes("porta")) {
    const nf = Math.max(1, folhas);
    const leafW = (w - profileW) / nf;

    for (let i = 0; i < nf; i++) {
      const lx = ox + profileW / 2 + i * leafW;

      // Glass pane (top 70%)
      elements.push(
        <rect key={`glass-${i}`}
          x={lx + profileW * 0.8} y={oy + profileW * 1.5}
          width={leafW - profileW * 0.8} height={(h - profileW * 3) * 0.7}
          fill={vidroColor} fillOpacity={vidroOpacity}
          stroke={vidroStroke} strokeWidth={0.5} rx={1} />
      );

      // Bottom panel (opaque)
      elements.push(
        <rect key={`panel-${i}`}
          x={lx + profileW * 0.8} y={oy + profileW * 1.5 + (h - profileW * 3) * 0.72}
          width={leafW - profileW * 0.8} height={(h - profileW * 3) * 0.28}
          fill={corHex} fillOpacity={0.3}
          stroke={corHex} strokeWidth={1} rx={1} />
      );

      // Leaf frame
      elements.push(
        <rect key={`leaf-${i}`}
          x={lx + 3} y={oy + profileW + 3}
          width={leafW - 6} height={h - profileW * 2 - 6}
          fill="none" stroke={corHex} strokeWidth={profileW * 0.5} rx={1} />
      );

      // Door handle
      const handleSide = i === 0 ? lx + leafW - profileW * 2 : lx + profileW;
      elements.push(
        <rect key={`handle-${i}`}
          x={handleSide} y={oy + h * 0.5}
          width={3} height={20} fill={corHex} rx={1.5} opacity={0.7} />,
        <circle key={`knob-${i}`}
          cx={handleSide + 1.5} cy={oy + h * 0.5 + 10}
          r={4} fill="none" stroke={corHex} strokeWidth={1.5} opacity={0.7} />
      );
    }
  } else {
    // Generic: frame + glass
    elements.push(
      <rect key="glass"
        x={ox + profileW} y={oy + profileW}
        width={w - profileW * 2} height={h - profileW * 2}
        fill={vidroColor} fillOpacity={vidroOpacity}
        stroke={vidroStroke} strokeWidth={0.5} rx={1} />
    );
  }

  // Dimension labels
  elements.push(
    // Width label
    <text key="dim-w" x={ox + w / 2} y={oy + h + 20}
      textAnchor="middle" fontSize={11} fill="#888" fontFamily="monospace">
      {largura} mm
    </text>,
    // Height label
    <text key="dim-h" x={ox - 10} y={oy + h / 2}
      textAnchor="middle" fontSize={11} fill="#888" fontFamily="monospace"
      transform={`rotate(-90, ${ox - 10}, ${oy + h / 2})`}>
      {altura} mm
    </text>,
    // Dimension lines
    <line key="dline-w1" x1={ox} y1={oy + h + 8} x2={ox + w} y2={oy + h + 8}
      stroke="#ccc" strokeWidth={0.5} />,
    <line key="dline-w2" x1={ox} y1={oy + h + 5} x2={ox} y2={oy + h + 11}
      stroke="#ccc" strokeWidth={0.5} />,
    <line key="dline-w3" x1={ox + w} y1={oy + h + 5} x2={ox + w} y2={oy + h + 11}
      stroke="#ccc" strokeWidth={0.5} />
  );

  return (
    <svg viewBox="0 0 400 430" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glass-blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
        </filter>
      </defs>
      {elements}
    </svg>
  );
}

// ─── Color Swatch Component ─────────────────────────────────────────

function ColorSwatch({ cor, selected, onClick }: { cor: CorAluminio; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={cor.nome}
      className={cn(
        "h-7 w-7 rounded-full border-2 transition-all hover:scale-110",
        selected ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border hover:border-muted-foreground"
      )}
      style={{ background: cor.swatch }}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function EsquadriaPreview3D({
  tipo,
  largura,
  altura,
  folhas = 2,
  nome,
  produtos,
  produtoIndex = 0,
  onProdutoChange,
  showTabs = true,
  onCorChange,
  onTabChange,
  className,
}: EsquadriaPreview3DProps) {
  const [selectedCor, setSelectedCor] = useState<CorAluminio>(CORES_ALUMINIO[0]);
  const [activeTab, setActiveTab] = useState<MaterialTab>("aluminio");

  const handleCorChange = (cor: CorAluminio) => {
    setSelectedCor(cor);
    onCorChange?.(cor);
  };

  const handleTabChange = (tab: MaterialTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const totalProdutos = produtos?.length ?? 0;
  const canNavigate = totalProdutos > 1;

  const svgPreview = useMemo(() => {
    return renderEsquadriaSVG(tipo, largura, altura, folhas, selectedCor.hex);
  }, [tipo, largura, altura, folhas, selectedCor.hex]);

  return (
    <div className={cn("relative bg-gradient-to-b from-background to-muted/30 rounded-xl border border-border overflow-hidden", className)}>
      {/* Brand / Header */}
      {nome && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="text-sm font-bold text-foreground/80 bg-background/80 backdrop-blur px-3 py-1 rounded-full border border-border/50">
            {nome}
          </span>
        </div>
      )}

      {/* SVG Preview */}
      <div className="w-full aspect-square max-h-[450px] p-6 pt-10">
        {svgPreview}
      </div>

      {/* Carousel Navigation */}
      {canNavigate && (
        <>
          <Button
            variant="ghost" size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/60 backdrop-blur hover:bg-background/80"
            onClick={() => onProdutoChange?.(produtoIndex > 0 ? produtoIndex - 1 : totalProdutos - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/60 backdrop-blur hover:bg-background/80"
            onClick={() => onProdutoChange?.(produtoIndex < totalProdutos - 1 ? produtoIndex + 1 : 0)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-center text-xs text-muted-foreground pb-1">
            {produtoIndex + 1} de {totalProdutos} produtos
          </div>
        </>
      )}

      {/* Bottom Panel: Tabs + Color Picker */}
      {showTabs && (
        <div className="border-t border-border bg-background/95 backdrop-blur">
          {/* Material Tabs */}
          <div className="flex border-b border-border">
            {(["vidro", "aluminio", "ferragens"] as MaterialTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors capitalize",
                  activeTab === tab
                    ? "text-primary-foreground bg-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab === "vidro" ? "Vidro" : tab === "aluminio" ? "Alumínio" : "Ferragens"}
              </button>
            ))}
          </div>

          {/* Color Picker (only for aluminio tab) */}
          {activeTab === "aluminio" && (
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-2">Selecione</p>
              <div className="flex flex-wrap gap-2">
                {CORES_ALUMINIO.map((cor) => (
                  <ColorSwatch
                    key={cor.id}
                    cor={cor}
                    selected={selectedCor.id === cor.id}
                    onClick={() => handleCorChange(cor)}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {selectedCor.nome}
              </p>
            </div>
          )}

          {activeTab === "vidro" && (
            <div className="p-3">
              <p className="text-xs text-muted-foreground">Opções de vidro disponíveis para este modelo.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Incolor 4mm", "Verde 6mm", "Fumê 6mm", "Temperado 8mm", "Laminado 8mm"].map((v) => (
                  <span key={v} className="text-xs bg-muted px-2 py-1 rounded-md border border-border">{v}</span>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ferragens" && (
            <div className="p-3">
              <p className="text-xs text-muted-foreground">Ferragens incluídas neste modelo.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Roldanas", "Fecho", "Puxador", "Escova vedação"].map((f) => (
                  <span key={f} className="text-xs bg-muted px-2 py-1 rounded-md border border-border">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
