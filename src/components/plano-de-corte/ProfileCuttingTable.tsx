import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getPerfilByCodigo, type PerfilCorte } from "@/data/perfis-aluminio";

const posicaoColors: Record<string, string> = {
  "Altura": "text-primary",
  "Largura": "text-[hsl(142,60%,45%)]",
  "Travessa": "text-[hsl(38,80%,50%)]",
  "Montante": "text-[hsl(280,60%,55%)]",
  "Diagonal": "text-[hsl(0,60%,55%)]",
};

interface ProfileCuttingTableProps {
  perfis: PerfilCorte[];
  produtoNome: string;
  largura: number;
  altura: number;
  showHeader?: boolean;
}

export function ProfileCuttingTable({ perfis, produtoNome, largura, altura, showHeader = true }: ProfileCuttingTableProps) {
  return (
    <div className="space-y-4">
      {/* Header com dimensões - only shown when showHeader is true */}
      {showHeader && (
        <div className="glass-card-premium p-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">{produtoNome}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Largura</label>
              <div className="bg-muted/50 border border-border rounded-lg px-4 py-2 text-sm font-semibold text-foreground mt-1">{largura}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Altura</label>
              <div className="bg-muted/50 border border-border rounded-lg px-4 py-2 text-sm font-semibold text-foreground mt-1">{altura}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de perfis - blue header like reference */}
      <div className="glass-card-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary">
              <TableHead className="font-bold text-primary-foreground text-xs uppercase">Perfil</TableHead>
              <TableHead className="font-bold text-primary-foreground text-xs uppercase text-center">Medida (mm)</TableHead>
              <TableHead className="font-bold text-primary-foreground text-xs uppercase text-center">Quantidade</TableHead>
              <TableHead className="font-bold text-primary-foreground text-xs uppercase text-center">Ângulo de Corte</TableHead>
              <TableHead className="font-bold text-primary-foreground text-xs uppercase text-center">Posição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perfis.map((pc, i) => {
              const perfil = getPerfilByCodigo(pc.perfilCodigo);
              return (
                <TableRow key={i} className="hover:bg-muted/30 border-b border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Mini diagram do perfil */}
                      <div className="w-14 h-14 bg-muted/30 rounded border border-border flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 50 50" className="w-10 h-10">
                          <rect x="4" y="4" width={Math.min(42, (perfil?.largura || 30) / 2.5)} height={Math.min(42, (perfil?.altura || 30) / 1.5)} fill="none" stroke="#444" strokeWidth="1.5" rx="1" />
                          {perfil && perfil.espessura > 1.2 && (
                            <rect x="8" y="8" width={Math.max(4, Math.min(34, (perfil.largura) / 2.5 - 8))} height={Math.max(4, Math.min(34, (perfil.altura) / 1.5 - 8))} fill="none" stroke="#888" strokeWidth="0.8" rx="0.5" />
                          )}
                          {/* Dimension lines */}
                          <text x="25" y="48" textAnchor="middle" fontSize="7" fill="#666" fontWeight="500">
                            {perfil ? `${perfil.largura}` : ""}
                          </text>
                          {perfil && (
                            <text x="46" y="25" textAnchor="middle" fontSize="6" fill="#666" fontWeight="500" transform="rotate(90, 46, 25)">
                              {perfil.altura}
                            </text>
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{pc.perfilCodigo}</p>
                        <p className="text-xs text-muted-foreground">{perfil?.descricao || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-semibold text-foreground">{pc.medida}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-semibold text-foreground">{pc.quantidade}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="inline-flex items-center justify-center bg-foreground text-background text-[10px] font-bold rounded px-3 py-1 min-w-[40px]">
                        {pc.anguloEsquerdo}°
                      </span>
                      <span className="inline-flex items-center justify-center bg-foreground text-background text-[10px] font-bold rounded px-3 py-1 min-w-[40px]">
                        {pc.anguloDireito}°
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${posicaoColors[pc.posicao] || "text-muted-foreground"}`}>
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {pc.posicao}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {/* Summary */}
        <div className="border-t border-border px-4 py-3 bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {perfis.length} perfis • {perfis.reduce((a, p) => a + p.quantidade, 0)} peças totais
          </span>
          <span className="text-xs text-muted-foreground">
            Peso estimado: {perfis.reduce((acc, pc) => {
              const perfil = getPerfilByCodigo(pc.perfilCodigo);
              return acc + (perfil ? perfil.peso * (pc.medida / 1000) * pc.quantidade : 0);
            }, 0).toFixed(2)} kg
          </span>
        </div>
      </div>
    </div>
  );
}
