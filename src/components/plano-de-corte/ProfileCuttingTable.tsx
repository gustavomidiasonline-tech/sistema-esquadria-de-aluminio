import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getPerfilByCodigo, type PerfilCorte } from "@/data/perfis-aluminio";

const posicaoColors: Record<string, string> = {
  "Altura": "bg-primary text-primary-foreground",
  "Largura": "bg-[hsl(142,60%,45%)] text-white",
  "Travessa": "bg-[hsl(38,80%,50%)] text-white",
  "Montante": "bg-[hsl(280,60%,55%)] text-white",
  "Diagonal": "bg-[hsl(0,60%,55%)] text-white",
};

interface ProfileCuttingTableProps {
  perfis: PerfilCorte[];
  produtoNome: string;
  largura: number;
  altura: number;
}

export function ProfileCuttingTable({ perfis, produtoNome, largura, altura }: ProfileCuttingTableProps) {
  return (
    <div className="space-y-4">
      {/* Header com dimensões */}
      <div className="bg-card border border-border rounded-xl p-5">
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

      {/* Tabela de perfis */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead className="font-bold text-primary text-xs uppercase">Perfil</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center">Medida (mm)</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center">Quantidade</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center">Ângulo de Corte</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center">Posição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perfis.map((pc, i) => {
              const perfil = getPerfilByCodigo(pc.perfilCodigo);
              return (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Mini diagram do perfil */}
                      <div className="w-12 h-12 bg-muted/50 rounded border border-border flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 40 40" className="w-8 h-8">
                          <rect x="2" y="2" width={Math.min(36, (perfil?.largura || 30) / 3)} height={Math.min(36, (perfil?.altura || 30) / 2)} fill="none" stroke="hsl(215, 25%, 40%)" strokeWidth="1.5" rx="1" />
                          {perfil && perfil.espessura > 1.2 && (
                            <rect x="5" y="5" width={Math.max(4, Math.min(30, (perfil.largura) / 3 - 6))} height={Math.max(4, Math.min(30, (perfil.altura) / 2 - 6))} fill="none" stroke="hsl(215, 25%, 60%)" strokeWidth="0.8" rx="0.5" />
                          )}
                          <text x="20" y="38" textAnchor="middle" fontSize="6" fill="hsl(215, 15%, 55%)" fontWeight="500">
                            {perfil ? `${perfil.largura}` : ""}
                          </text>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{pc.perfilCodigo}</p>
                        <p className="text-xs text-muted-foreground">{perfil?.descricao || "—"}</p>
                        {perfil && <p className="text-[10px] text-muted-foreground/70">{perfil.linha} • {perfil.peso} kg/m</p>}
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
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold rounded px-2 py-0.5 min-w-[36px]">
                        {pc.anguloEsquerdo}°
                      </span>
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold rounded px-2 py-0.5 min-w-[36px]">
                        {pc.anguloDireito}°
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${posicaoColors[pc.posicao] || "bg-muted text-muted-foreground"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      {pc.posicao}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {/* Resumo */}
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
