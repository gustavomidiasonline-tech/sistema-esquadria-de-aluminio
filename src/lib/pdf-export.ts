import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ItemVidro, ItemFerragem } from "@/lib/calculo-esquadria";

// Extend jsPDF type for autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface OrcamentoData {
  numero: number;
  status?: string;
  clientes?: { nome?: string; telefone?: string; email?: string } | null;
  created_at: string;
  validade?: string | null;
  valor_total?: number | null;
  descricao?: string | null;
  observacoes?: string | null;
}

interface OrcamentoItemData {
  descricao: string;
  largura?: number | null;
  altura?: number | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  tipo_vidro?: string | null;
  area_vidro_m2?: number | null;
  custo_aluminio?: number | null;
  custo_vidro?: number | null;
  custo_ferragem?: number | null;
  custo_acessorios?: number | null;
  custo_mao_obra?: number | null;
  custo_total?: number | null;
  lucro?: number | null;
  markup_percentual?: number | null;
  peso_total_kg?: number | null;
}

interface PedidoData {
  numero: number;
  status: string;
  clientes?: { nome?: string; telefone?: string; endereco?: string; cidade?: string; estado?: string } | null;
  created_at: string;
  data_entrega?: string | null;
  valor_total?: number | null;
  vendedor?: string | null;
  endereco_entrega?: string | null;
  observacoes?: string | null;
}

interface PedidoItemData {
  descricao: string;
  largura?: number | null;
  altura?: number | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

interface CostAccumulator {
  aluminio: number;
  vidro: number;
  ferragem: number;
  acessorios: number;
  maoObra: number;
  custo: number;
  lucro: number;
  peso: number;
  vidroM2: number;
  venda: number;
}

const COLORS = {
  primary: [124, 58, 237] as [number, number, number],     // purple
  dark: [30, 30, 40] as [number, number, number],
  muted: [120, 120, 140] as [number, number, number],
  light: [245, 243, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [220, 220, 230] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
};

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Purple bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 14, 21);
  }

  // Company info
  doc.setFontSize(8);
  doc.text("Sistema Esquadria de Alumínio", 196, 10, { align: "right" });
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, 196, 16, { align: "right" });

  doc.setTextColor(...COLORS.dark);
  return 36;
}

function addInfoBlock(doc: jsPDF, y: number, items: { label: string; value: string }[], columns = 2) {
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(14, y, 182, Math.ceil(items.length / columns) * 12 + 8, 3, 3, "F");

  const colWidth = 182 / columns;
  items.forEach((item, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = 18 + col * colWidth;
    const iy = y + 10 + row * 12;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(item.label.toUpperCase(), x, iy);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "bold");
    doc.text(item.value, x, iy + 5);
  });

  return y + Math.ceil(items.length / columns) * 12 + 14;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    doc.setDrawColor(...COLORS.border);
    doc.line(14, 285, 196, 285);
  }
}

const VIDRO_LABELS: Record<string, string> = {
  temperado_6mm: "Temperado 6mm",
  temperado_8mm: "Temperado 8mm",
  temperado_10mm: "Temperado 10mm",
  laminado_8mm: "Laminado 8mm",
  comum_4mm: "Comum 4mm",
};

// ===== ORÇAMENTO PDF =====
export function exportOrcamentoPDF(orcamento: OrcamentoData, itens: OrcamentoItemData[]) {
  const doc = new jsPDF();
  let y = addHeader(doc, `ORÇAMENTO #${String(orcamento.numero).padStart(3, "0")}`, `Status: ${orcamento.status?.toUpperCase() || "RASCUNHO"}`);

  const infoItems = [
    { label: "Cliente", value: orcamento.clientes?.nome || "—" },
    { label: "Data", value: new Date(orcamento.created_at).toLocaleDateString("pt-BR") },
    { label: "Validade", value: orcamento.validade ? new Date(orcamento.validade).toLocaleDateString("pt-BR") : "—" },
    { label: "Valor Total", value: fmt(Number(orcamento.valor_total) || 0) },
  ];
  if (orcamento.clientes?.telefone) infoItems.push({ label: "Telefone", value: orcamento.clientes.telefone });
  if (orcamento.clientes?.email) infoItems.push({ label: "Email", value: orcamento.clientes.email });
  y = addInfoBlock(doc, y, infoItems);

  if (orcamento.descricao) {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("Descrição:", 14, y);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "normal");
    doc.text(orcamento.descricao, 14, y + 5, { maxWidth: 182 });
    y += 14;
  }

  // Check if items have cost breakdown data
  const hasCostData = itens.some((i) => (Number(i.custo_aluminio) || 0) > 0 || (Number(i.custo_vidro) || 0) > 0);

  // ── Items table ──
  if (itens.length > 0) {
    const tableBody = itens.map((i) => {
      const m2 = i.area_vidro_m2
        ? Number(i.area_vidro_m2).toFixed(3)
        : i.largura && i.altura
          ? ((i.largura / 1000) * (i.altura / 1000)).toFixed(3)
          : "—";
      return [
        i.descricao + (i.tipo_vidro ? `\n${VIDRO_LABELS[i.tipo_vidro] || i.tipo_vidro}` : ""),
        i.largura && i.altura ? `${i.largura}×${i.altura}mm` : "—",
        m2,
        String(i.quantidade),
        fmt(Number(i.valor_unitario)),
        fmt(Number(i.valor_total)),
      ];
    });

    doc.autoTable({
      startY: y,
      head: [["Item", "Dimensões", "m² Vidro", "Qtd", "Valor Unit.", "Valor Total"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 8, textColor: COLORS.dark },
      columnStyles: {
        0: { cellWidth: 55 },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: [250, 248, 255] },
      margin: { left: 14, right: 14 },
      foot: [["", "", "", "", "TOTAL:", fmt(itens.reduce((s: number, i: OrcamentoItemData) => s + Number(i.valor_total), 0))]],
      footStyles: { fillColor: COLORS.light, textColor: COLORS.primary, fontSize: 9, fontStyle: "bold", halign: "right" },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Cost breakdown table (per item) ──
  if (hasCostData) {
    // Check page space
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("DETALHAMENTO DE CUSTOS", 14, y);
    y += 6;

    const costBody = itens.map((i) => [
      i.descricao.substring(0, 30),
      fmt(Number(i.custo_aluminio) || 0),
      fmt(Number(i.custo_vidro) || 0),
      fmt(Number(i.custo_ferragem) || 0),
      fmt(Number(i.custo_acessorios) || 0),
      fmt(Number(i.custo_mao_obra) || 0),
      fmt(Number(i.custo_total) || 0),
      fmt(Number(i.lucro) || 0),
      fmt(Number(i.valor_total) || 0),
    ]);

    doc.autoTable({
      startY: y,
      head: [["Item", "Alumínio", "Vidro", "Ferragem", "Acess.", "M.Obra", "Custo", "Lucro", "Venda"]],
      body: costBody,
      theme: "grid",
      headStyles: { fillColor: [50, 50, 65], textColor: COLORS.white, fontSize: 6.5, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 6.5, textColor: COLORS.dark, halign: "right" },
      columnStyles: {
        0: { halign: "left", cellWidth: 30 },
        6: { fontStyle: "bold" },
        7: { textColor: COLORS.success, fontStyle: "bold" },
        8: { textColor: COLORS.primary, fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: [250, 248, 255] },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 8;

    // ── Aggregated cost summary ──
    const totals = itens.reduce<CostAccumulator>(
      (acc, i) => ({
        aluminio: acc.aluminio + (Number(i.custo_aluminio) || 0),
        vidro: acc.vidro + (Number(i.custo_vidro) || 0),
        ferragem: acc.ferragem + (Number(i.custo_ferragem) || 0),
        acessorios: acc.acessorios + (Number(i.custo_acessorios) || 0),
        maoObra: acc.maoObra + (Number(i.custo_mao_obra) || 0),
        custo: acc.custo + (Number(i.custo_total) || 0),
        lucro: acc.lucro + (Number(i.lucro) || 0),
        peso: acc.peso + (Number(i.peso_total_kg) || 0),
        vidroM2: acc.vidroM2 + (Number(i.area_vidro_m2) || 0),
        venda: acc.venda + (Number(i.valor_total) || 0),
      }),
      { aluminio: 0, vidro: 0, ferragem: 0, acessorios: 0, maoObra: 0, custo: 0, lucro: 0, peso: 0, vidroM2: 0, venda: 0 }
    );

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    // Summary box
    const boxH = 38;
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(14, y, 182, boxH, 3, 3, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("RESUMO DE CUSTOS", 18, y + 7);

    const summaryItems = [
      { label: "Alumínio", value: fmt(totals.aluminio) },
      { label: "Vidro", value: fmt(totals.vidro) },
      { label: "Ferragem", value: fmt(totals.ferragem) },
      { label: "Acessórios", value: fmt(totals.acessorios) },
      { label: "Mão de Obra", value: fmt(totals.maoObra) },
    ];

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    summaryItems.forEach((item, idx) => {
      const x = 18 + idx * 36;
      doc.setTextColor(...COLORS.muted);
      doc.text(item.label, x, y + 14);
      doc.setTextColor(...COLORS.dark);
      doc.setFont("helvetica", "bold");
      doc.text(item.value, x, y + 19);
      doc.setFont("helvetica", "normal");
    });

    // Bottom row: totals
    doc.setDrawColor(...COLORS.border);
    doc.line(18, y + 23, 192, y + 23);

    const bottomY = y + 29;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");

    doc.text("Custo Total:", 18, bottomY);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(totals.custo), 48, bottomY);

    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Lucro:", 80, bottomY);
    doc.setTextColor(...COLORS.success);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(totals.lucro), 96, bottomY);

    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Preço de Venda:", 130, bottomY);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(fmt(totals.venda), 165, bottomY);

    // Extra info
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    const extraInfo: string[] = [];
    if (totals.peso > 0) extraInfo.push(`Peso total: ${totals.peso.toFixed(2)} kg`);
    if (totals.vidroM2 > 0) extraInfo.push(`Vidro total: ${totals.vidroM2.toFixed(2)} m²`);
    const avgMarkup = itens.filter((i) => i.markup_percentual).map((i) => Number(i.markup_percentual));
    if (avgMarkup.length > 0) {
      const avg = avgMarkup.reduce((a: number, b: number) => a + b, 0) / avgMarkup.length;
      extraInfo.push(`Markup médio: ${avg.toFixed(1)}%`);
    }
    if (extraInfo.length > 0) {
      doc.text(extraInfo.join("  ·  "), 18, y + 35);
    }

    y += boxH + 8;
  } else {
    // Fallback: simple totals for items without cost data
    const totalM2 = itens.reduce((s: number, i: OrcamentoItemData) => {
      if (i.largura && i.altura) return s + (i.largura / 1000) * (i.altura / 1000) * i.quantidade;
      return s;
    }, 0);

    if (totalM2 > 0) {
      doc.setFillColor(...COLORS.light);
      doc.roundedRect(14, y, 182, 16, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text("Área total de vidro:", 18, y + 7);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(`${totalM2.toFixed(2)} m²`, 65, y + 7);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(`${itens.length} ${itens.length === 1 ? "item" : "itens"}`, 18, y + 12);
      y += 22;
    }
  }

  if (orcamento.observacoes) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text("OBSERVAÇÕES", 14, y);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "normal");
    doc.text(orcamento.observacoes, 14, y + 5, { maxWidth: 182 });
  }

  addFooter(doc);
  doc.save(`orcamento-${String(orcamento.numero).padStart(3, "0")}.pdf`);
}

// ===== PEDIDO PDF =====
export function exportPedidoPDF(pedido: PedidoData, itens?: PedidoItemData[]) {
  const doc = new jsPDF();
  const statusLabels: Record<string, string> = {
    pendente: "PENDENTE", em_producao: "EM PRODUÇÃO", pronto: "PRONTO", entregue: "ENTREGUE", cancelado: "CANCELADO",
  };
  let y = addHeader(doc, `PEDIDO #${String(pedido.numero).padStart(3, "0")}`, `Status: ${statusLabels[pedido.status] || pedido.status}`);

  const infoItems = [
    { label: "Cliente", value: pedido.clientes?.nome || "—" },
    { label: "Data do Pedido", value: new Date(pedido.created_at).toLocaleDateString("pt-BR") },
    { label: "Previsão Entrega", value: pedido.data_entrega ? new Date(pedido.data_entrega).toLocaleDateString("pt-BR") : "—" },
    { label: "Valor Total", value: fmt(Number(pedido.valor_total) || 0) },
  ];
  if (pedido.vendedor) infoItems.push({ label: "Vendedor", value: pedido.vendedor });
  if (pedido.clientes?.telefone) infoItems.push({ label: "Telefone", value: pedido.clientes.telefone });
  if (pedido.clientes?.endereco) {
    let addr = pedido.clientes.endereco;
    if (pedido.clientes.cidade) addr += `, ${pedido.clientes.cidade}`;
    if (pedido.clientes.estado) addr += ` - ${pedido.clientes.estado}`;
    infoItems.push({ label: "Endereço", value: addr });
  }
  if (pedido.endereco_entrega) infoItems.push({ label: "Endereço Entrega", value: pedido.endereco_entrega });
  y = addInfoBlock(doc, y, infoItems);

  if (itens && itens.length > 0) {
    const tableBody = itens.map((i) => [
      i.descricao,
      i.largura && i.altura ? `${i.largura}×${i.altura}mm` : "—",
      String(i.quantidade),
      fmt(Number(i.valor_unitario)),
      fmt(Number(i.valor_total)),
    ]);

    doc.autoTable({
      startY: y,
      head: [["Item", "Dimensões", "Qtd", "Valor Unit.", "Valor Total"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 8, textColor: COLORS.dark },
      columnStyles: {
        0: { cellWidth: 65 },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: [250, 248, 255] },
      margin: { left: 14, right: 14 },
      foot: [["", "", "", "TOTAL:", fmt(itens.reduce((s: number, i: PedidoItemData) => s + Number(i.valor_total), 0))]],
      footStyles: { fillColor: COLORS.light, textColor: COLORS.primary, fontSize: 9, fontStyle: "bold", halign: "right" },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (pedido.observacoes) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text("OBSERVAÇÕES", 14, y);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "normal");
    doc.text(pedido.observacoes, 14, y + 5, { maxWidth: 182 });
  }

  addFooter(doc);
  doc.save(`pedido-${String(pedido.numero).padStart(3, "0")}.pdf`);
}

// ===== LISTA DE CORTE PDF =====
export function exportListaCortePDF(
  produtoNome: string,
  largura: number,
  altura: number,
  perfis: { codigo: string; descricao?: string; posicao: string; medida: number; quantidade: number; pesoMetro?: number; anguloEsq?: number; anguloDir?: number }[],
  vidros?: ItemVidro[],
  ferragens?: ItemFerragem[],
  materiaisAux?: ItemFerragem[]
) {
  const doc = new jsPDF();
  let y = addHeader(doc, "LISTA DE CORTE", produtoNome);

  const m2 = ((largura / 1000) * (altura / 1000)).toFixed(3);
  const pesoTotal = perfis.reduce((s, p) => s + (p.medida / 1000) * (p.pesoMetro || 0) * p.quantidade, 0);
  const areaVidroTotal = vidros ? vidros.reduce((s, v) => s + v.area_m2, 0).toFixed(2) : m2;

  y = addInfoBlock(doc, y, [
    { label: "Produto", value: produtoNome },
    { label: "Dimensões", value: `${largura} × ${altura} mm` },
    { label: "Área de Vidro", value: `${areaVidroTotal} m²` },
    { label: "Peso Estimado", value: `${pesoTotal.toFixed(2)} kg` },
  ]);

  // ── Perfis ──
  if (perfis.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("LISTA DE PERFIS", 14, y);
    y += 5;

    const tableBody = perfis.map((p) => [
      p.codigo,
      p.descricao || "—",
      p.posicao,
      `${p.medida} mm`,
      String(p.quantidade),
      p.anguloEsq != null ? `${p.anguloEsq}°` : "90°",
      p.anguloDir != null ? `${p.anguloDir}°` : "90°",
      p.pesoMetro ? `${((p.medida / 1000) * p.pesoMetro * p.quantidade).toFixed(2)} kg` : "—",
    ]);

    doc.autoTable({
      startY: y,
      head: [["Código", "Descrição", "Posição", "Medida", "Qtd", "Âng. Esq.", "Âng. Dir.", "Peso"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 7.5, textColor: COLORS.dark },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 22 },
        1: { cellWidth: 40 },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
        6: { halign: "center" },
        7: { halign: "right" },
      },
      alternateRowStyles: { fillColor: [250, 248, 255] },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Vidros ──
  if (vidros && vidros.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("VIDROS", 14, y);
    y += 5;

    doc.autoTable({
      startY: y,
      head: [["Descrição", "Largura (mm)", "Altura (mm)", "Qtd", "Área (m²)"]],
      body: vidros.map((v) => [v.descricao, String(v.largura_mm), String(v.altura_mm), String(v.quantidade), `${v.area_m2} m²`]),
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] as [number, number, number], textColor: COLORS.white, fontSize: 7, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 7.5, textColor: COLORS.dark },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Ferragens e Materiais Auxiliares (side by side) ──
  const temFerragens = ferragens && ferragens.length > 0;
  const temMateriais = materiaisAux && materiaisAux.length > 0;

  if (temFerragens || temMateriais) {
    if (y > 200) { doc.addPage(); y = 20; }

    if (temFerragens) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.dark);
      doc.text("FERRAGENS", 14, y);
      y += 5;

      doc.autoTable({
        startY: y,
        head: [["Item", "Qtd", "Un."]],
        body: ferragens.map((f) => [
          f.nome + (f.observacao ? ` (${f.observacao})` : ""),
          String(f.quantidade),
          f.unidade,
        ]),
        theme: "grid",
        headStyles: { fillColor: [245, 158, 11] as [number, number, number], textColor: COLORS.white, fontSize: 7, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 7.5, textColor: COLORS.dark },
        columnStyles: { 0: { cellWidth: 110 }, 1: { halign: "center", cellWidth: 20 }, 2: { halign: "center" } },
        margin: { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 8;
    }

    if (temMateriais) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.dark);
      doc.text("MATERIAIS AUXILIARES", 14, y);
      y += 5;

      doc.autoTable({
        startY: y,
        head: [["Item", "Qtd", "Un."]],
        body: materiaisAux.map((m) => [
          m.nome + (m.observacao ? ` (${m.observacao})` : ""),
          String(m.quantidade),
          m.unidade,
        ]),
        theme: "grid",
        headStyles: { fillColor: COLORS.muted, textColor: COLORS.white, fontSize: 7, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 7.5, textColor: COLORS.dark },
        columnStyles: { 0: { cellWidth: 110 }, 1: { halign: "center", cellWidth: 20 }, 2: { halign: "center" } },
        alternateRowStyles: { fillColor: [250, 248, 255] },
        margin: { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 8;
    }
  }

  // Summary
  if (y > 255) { doc.addPage(); y = 20; }
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(14, y, 182, 14, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${perfis.length} perfis · ${perfis.reduce((s, p) => s + p.quantidade, 0)} peças`, 18, y + 6);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(`Peso total: ${pesoTotal.toFixed(2)} kg  ·  Vidro: ${areaVidroTotal} m²`, 18, y + 11);

  addFooter(doc);
  doc.save(`lista-corte-${produtoNome.replace(/\s+/g, "-").toLowerCase()}-${largura}x${altura}.pdf`);
}

// ===== MATERIAIS (BOM) PDF =====
interface MaterialItem {
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
}

interface BOMItemData {
  descricao: string;
  largura: number;
  altura: number;
  quantidade: number;
  materiais: MaterialItem[];
}

export function exportMateriaisPDF(
  orcamentoNumero: number,
  clienteNome: string,
  agregados: MaterialItem[],
  bomsPorItem: BOMItemData[],
  opcoes: { perfis?: boolean; componentes?: boolean; vidros?: boolean } = { perfis: true, componentes: true, vidros: true }
) {
  const doc = new jsPDF();
  let y = addHeader(doc, "LISTA DE MATERIAIS", `Orcamento #${String(orcamentoNumero).padStart(3, "0")}`);

  y = addInfoBlock(doc, y, [
    { label: "Orcamento", value: `#${String(orcamentoNumero).padStart(3, "0")}` },
    { label: "Cliente", value: clienteNome },
    { label: "Itens", value: `${bomsPorItem.length}` },
    { label: "Materiais", value: `${agregados.length} tipos` },
  ]);

  const categorias = [
    { key: "aluminio", label: "PERFIS DE ALUMINIO", color: [245, 158, 11] as [number, number, number], enabled: opcoes.perfis !== false },
    { key: "vidro", label: "VIDROS", color: [59, 130, 246] as [number, number, number], enabled: opcoes.vidros !== false },
    { key: "ferragem", label: "FERRAGENS / COMPONENTES", color: [249, 115, 22] as [number, number, number], enabled: opcoes.componentes !== false },
    { key: "acessorio", label: "ACESSORIOS", color: [168, 85, 247] as [number, number, number], enabled: opcoes.componentes !== false },
    { key: "borracha", label: "BORRACHAS / VEDACAO", color: [6, 182, 212] as [number, number, number], enabled: opcoes.componentes !== false },
  ];

  for (const cat of categorias) {
    if (!cat.enabled) continue;
    const items = agregados.filter((m) => m.categoria === cat.key);
    if (items.length === 0) continue;

    if (y > 230) { doc.addPage(); y = 20; }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(cat.label, 14, y);
    y += 5;

    doc.autoTable({
      startY: y,
      head: [["Material", "Quantidade", "Unidade"]],
      body: items.map((m) => [
        m.nome,
        typeof m.quantidade === "number" && m.unidade === "m2"
          ? m.quantidade.toFixed(3)
          : typeof m.quantidade === "number" && (m.unidade === "metro" || m.unidade === "m")
            ? m.quantidade.toFixed(2)
            : String(m.quantidade),
        m.unidade,
      ]),
      theme: "grid",
      headStyles: { fillColor: cat.color, textColor: COLORS.white, fontSize: 7.5, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 7.5, textColor: COLORS.dark },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: "center", fontStyle: "bold", cellWidth: 35 },
        2: { halign: "center" },
      },
      alternateRowStyles: { fillColor: [250, 248, 255] },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // Detalhamento por item
  if (bomsPorItem.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("DETALHAMENTO POR ITEM", 14, y);
    y += 6;

    for (const bom of bomsPorItem) {
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text(`${bom.descricao} (${bom.largura}x${bom.altura}mm - Qtd: ${bom.quantidade})`, 14, y);
      y += 5;

      const filteredMats = bom.materiais.filter((m) => {
        if (m.categoria === "aluminio" && opcoes.perfis === false) return false;
        if (m.categoria === "vidro" && opcoes.vidros === false) return false;
        if ((m.categoria === "ferragem" || m.categoria === "acessorio" || m.categoria === "borracha") && opcoes.componentes === false) return false;
        return true;
      });

      if (filteredMats.length === 0) continue;

      doc.autoTable({
        startY: y,
        head: [["Material", "Categoria", "Qtd", "Un."]],
        body: filteredMats.map((m) => [
          m.nome,
          m.categoria,
          typeof m.quantidade === "number" ? (m.unidade === "m2" ? m.quantidade.toFixed(3) : m.quantidade.toFixed(2)) : String(m.quantidade),
          m.unidade,
        ]),
        theme: "grid",
        headStyles: { fillColor: [80, 80, 95], textColor: COLORS.white, fontSize: 7, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 7, textColor: COLORS.dark },
        columnStyles: { 0: { cellWidth: 80 }, 2: { halign: "center", fontStyle: "bold" }, 3: { halign: "center" } },
        margin: { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 6;
    }
  }

  // Summary
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(14, y, 182, 14, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${agregados.length} materiais distintos · ${bomsPorItem.length} itens`, 18, y + 6);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  const totalPerfis = agregados.filter((m) => m.categoria === "aluminio").reduce((s, m) => s + m.quantidade, 0);
  const totalVidro = agregados.filter((m) => m.categoria === "vidro").reduce((s, m) => s + m.quantidade, 0);
  doc.text(`Perfis: ${totalPerfis.toFixed(2)} m  ·  Vidro: ${totalVidro.toFixed(3)} m²`, 18, y + 11);

  addFooter(doc);
  doc.save(`materiais-orcamento-${String(orcamentoNumero).padStart(3, "0")}.pdf`);
}
