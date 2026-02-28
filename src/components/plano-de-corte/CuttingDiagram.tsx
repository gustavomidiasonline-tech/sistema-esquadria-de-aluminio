interface Peca {
  id: number;
  largura: number;
  altura: number;
  qtd: number;
  material: string;
}

interface Plano {
  id: number;
  nome: string;
  data: string;
  status: "concluido" | "andamento" | "pendente";
  chapa: { largura: number; altura: number };
  pecas: Peca[];
  aproveitamento: number;
}

const COLORS = [
  "hsl(207, 90%, 70%)", "hsl(142, 60%, 65%)", "hsl(38, 80%, 65%)",
  "hsl(280, 60%, 70%)", "hsl(0, 60%, 70%)", "hsl(180, 50%, 60%)",
];

export function CuttingDiagram({ plano }: { plano: Plano }) {
  const scale = 280 / Math.max(plano.chapa.largura, plano.chapa.altura);
  const w = plano.chapa.largura * scale;
  const h = plano.chapa.altura * scale;

  const rects: { x: number; y: number; w: number; h: number; color: string; label: string }[] = [];
  let cx = 4, cy = 4;
  let rowH = 0;
  plano.pecas.forEach((p, pi) => {
    for (let q = 0; q < p.qtd; q++) {
      const pw = p.largura * scale;
      const ph = p.altura * scale;
      if (cx + pw > w - 4) { cx = 4; cy += rowH + 3; rowH = 0; }
      rects.push({ x: cx, y: cy, w: pw, h: ph, color: COLORS[pi % COLORS.length], label: `${p.largura}x${p.altura}` });
      cx += pw + 3;
      rowH = Math.max(rowH, ph);
    }
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full border border-border rounded-lg bg-muted/30" style={{ maxHeight: 220 }}>
      <rect x={0} y={0} width={w} height={h} fill="hsl(210, 20%, 96%)" stroke="hsl(214, 20%, 80%)" strokeWidth={1.5} rx={4} />
      {rects.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.color} fillOpacity={0.35} stroke={r.color} strokeWidth={1.2} rx={2} />
          <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(10, r.w / 6)} fill="hsl(215, 25%, 25%)" fontWeight={600}>
            {r.label}
          </text>
        </g>
      ))}
      <text x={w - 6} y={h - 6} textAnchor="end" fontSize={8} fill="hsl(215, 15%, 55%)">
        {plano.chapa.largura}x{plano.chapa.altura}mm
      </text>
    </svg>
  );
}

export { COLORS };
export type { Peca, Plano };
