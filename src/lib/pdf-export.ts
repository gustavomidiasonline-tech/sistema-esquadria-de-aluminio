import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type for autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
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
  doc.text("ManagEasy", 196, 10, { align: "right" });
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
export function exportOrcamentoPDF(orcamento: any, itens: any[]) {
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
  const hasCostData = itens.some((i: any) => (Number(i.custo_aluminio) || 0) > 0 || (Number(i.custo_vidro) || 0) > 0);

  // ── Items table ──
  if (itens.length > 0) {
    const tableBody = itens.map((i: any) => {
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
      foot: [["", "", "", "", "TOTAL:", fmt(itens.reduce((s: number, i: any) => s + Number(i.valor_total), 0))]],
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

    const costBody = itens.map((i: any) => [
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
    const totals = itens.reduce(
      (acc: any, i: any) => ({
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
    const avgMarkup = itens.filter((i: any) => i.markup_percentual).map((i: any) => Number(i.markup_percentual));
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
    const totalM2 = itens.reduce((s: number, i: any) => {
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
export function exportPedidoPDF(pedido: any, itens?: any[]) {
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
    const tableBody = itens.map((i: any) => [
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
      foot: [["", "", "", "TOTAL:", fmt(itens.reduce((s: number, i: any) => s + Number(i.valor_total), 0))]],
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
  perfis: { codigo: string; descricao?: string; posicao: string; medida: number; quantidade: number; pesoMetro?: number; anguloEsq?: number; anguloDir?: number }[]
) {
  const doc = new jsPDF();
  let y = addHeader(doc, "LISTA DE CORTE", produtoNome);

  const m2 = ((largura / 1000) * (altura / 1000)).toFixed(3);
  const pesoTotal = perfis.reduce((s, p) => s + (p.medida / 1000) * (p.pesoMetro || 0) * p.quantidade, 0);

  y = addInfoBlock(doc, y, [
    { label: "Produto", value: produtoNome },
    { label: "Dimensões", value: `${largura} × ${altura} mm` },
    { label: "Área do Vidro", value: `${m2} m²` },
    { label: "Peso Estimado", value: `${pesoTotal.toFixed(2)} kg` },
  ]);

  if (perfis.length > 0) {
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

  // Summary
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(14, y, 182, 14, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${perfis.length} perfis · ${perfis.reduce((s, p) => s + p.quantidade, 0)} peças`, 18, y + 6);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(`Peso total: ${pesoTotal.toFixed(2)} kg`, 18, y + 11);

  addFooter(doc);
  doc.save(`lista-corte-${produtoNome.replace(/\s+/g, "-").toLowerCase()}-${largura}x${altura}.pdf`);
}
