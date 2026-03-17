#!/usr/bin/env node
/**
 * Squad Estoque - Inventory Management & Catalogs
 * Porta: 3003
 */

const express = require('express');
const app = express();
app.use(express.json());

// Estado em memória (em produção seria DB)
const inventario = {
  'aluminio_6063': { quantidade: 500, minimo: 50, unidade: 'm²', status: 'ok', fornecedor: 'Aluma Brasil' },
  'vidro_temperado': { quantidade: 300, minimo: 30, unidade: 'unidades', status: 'ok', fornecedor: 'Vidraria Premium' }
};

const reservas = [];
const sincronizacoes = [];
const movimentacoes = [];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', squad: 'squad-estoque', timestamp: new Date().toISOString() });
});

// Rastrear Inventário
app.post('/track-inventory', (req, res) => {
  const { material_id, quantidade, tipo } = req.body;

  if (tipo === 'entrada') {
    inventario[material_id].quantidade += quantidade;
  } else if (tipo === 'saida') {
    inventario[material_id].quantidade -= quantidade;
  }

  const diasEstoque = inventario[material_id].quantidade / 2;
  const alerta = diasEstoque < inventario[material_id].minimo;

  console.log(`✓ Inventário atualizado: ${material_id}`);
  res.json({
    material_id,
    saldo_novo: inventario[material_id].quantidade,
    dias_estoque: diasEstoque,
    alerta_reposicao: alerta ? 'SIM' : 'NÃO'
  });
});

// Reservar Material
app.post('/reserve-material', (req, res) => {
  const { reserva_id, materiais_para_reservar } = req.body;

  let sucesso = true;
  const resultados = materiais_para_reservar.map(mat => {
    const disponivel = inventario[mat.material_id]?.quantidade >= mat.quantidade;

    if (disponivel) {
      inventario[mat.material_id].quantidade -= mat.quantidade;
      reservas.push({ reserva_id, material: mat.material_id, qtd: mat.quantidade });
    }

    return {
      material_id: mat.material_id,
      status: disponivel ? 'reservado' : 'insuficiente',
      quantidade_reservada: mat.quantidade,
      disponivel_pos: inventario[mat.material_id]?.quantidade
    };
  });

  console.log(`✓ Reserva processada: ${reserva_id}`);
  res.json({ reserva_id, status: sucesso ? 'reservado' : 'parcial', materiais: resultados });
});

// Gerenciar Catálogo
app.post('/manage-catalog', (req, res) => {
  const { tipo, sku, preco } = req.body;

  console.log(`✓ Catálogo atualizado: ${tipo} ${sku}`);
  res.json({
    operacao: tipo,
    sku,
    preco,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Alertas de Reposição
app.post('/alert-low-stock', (req, res) => {
  const alertas = Object.entries(inventario)
    .filter(([_, mat]) => mat.quantidade < mat.minimo)
    .map(([id, mat]) => ({
      material_id: id,
      quantidade_atual: mat.quantidade,
      quantidade_minima: mat.minimo,
      quantidade_faltante: mat.minimo - mat.quantidade,
      urgencia: 'alta'
    }));

  console.log(`✓ Verificação de alertas completa (${alertas.length} alertas)`);
  res.json({ alertas, total: alertas.length });
});

// Verificar Reserva
app.get('/verificar-reserva', (req, res) => {
  const { plano } = req.query;
  const encontrada = reservas.some(r => r.reserva_id.includes(plano));

  res.json({
    plano,
    reservado: encontrada,
    total_reservas: reservas.length
  });
});

// 🔄 SINCRONIZAR ESTOQUE COM FORNECEDORES
app.post('/sincronizar-estoque', (req, res) => {
  const sincId = `SINC-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const verificacoes = [];
  const reabastecimentos = [];

  // Verificar cada material
  Object.entries(inventario).forEach(([materialId, material]) => {
    const verificacao = {
      material_id: materialId,
      quantidade_atual: material.quantidade,
      minimo: material.minimo,
      status: 'verificado'
    };

    // Se está abaixo do mínimo, reabastece automaticamente
    if (material.quantidade < material.minimo) {
      const quantidade_reabastecer = material.minimo * 5; // Reabastece 5x o mínimo

      inventario[materialId].quantidade += quantidade_reabastecer;

      reabastecimentos.push({
        material_id: materialId,
        quantidade_anterior: material.quantidade - quantidade_reabastecer,
        quantidade_nova: material.quantidade,
        quantidade_reabastecer,
        fornecedor: material.fornecedor,
        status: 'reabastecido'
      });

      // Log de movimentação
      movimentacoes.push({
        tipo: 'reabastecimento',
        material_id: materialId,
        quantidade: quantidade_reabastecer,
        timestamp,
        fornecedor: material.fornecedor
      });

      verificacao.status = 'reabastecido';
    }

    verificacoes.push(verificacao);
  });

  // Registrar sincronização
  sincronizacoes.push({
    sinc_id: sincId,
    timestamp,
    materiais_verificados: Object.keys(inventario).length,
    materiais_reabastecidos: reabastecimentos.length,
    status: 'completa'
  });

  console.log(`✓ Sincronização ${sincId} completada: ${reabastecimentos.length} materiais reabastecidos`);

  res.json({
    sinc_id: sincId,
    timestamp,
    verificacoes,
    reabastecimentos,
    status: 'sucesso',
    total_operacoes: reabastecimentos.length
  });
});

// 📊 CONSULTAR ESTADO ATUAL DO ESTOQUE
app.get('/status-estoque', (req, res) => {
  const resumo = Object.entries(inventario).map(([id, mat]) => ({
    material_id: id,
    quantidade_atual: mat.quantidade,
    minimo: mat.minimo,
    percentual_ocupacao: Math.round((mat.quantidade / (mat.minimo * 5)) * 100),
    status: mat.quantidade < mat.minimo ? '⚠️ BAIXO' : mat.quantidade < mat.minimo * 2 ? '🟡 ATENÇÃO' : '🟢 OK',
    fornecedor: mat.fornecedor
  }));

  const totalReservas = reservas.reduce((sum, r) => sum + r.qtd, 0);
  const totalMovimentacoes = movimentacoes.length;
  const totalSincronizacoes = sincronizacoes.length;

  res.json({
    timestamp: new Date().toISOString(),
    resumo,
    total_reservas: reservas.length,
    quantidade_total_reservada: totalReservas,
    total_movimentacoes: totalMovimentacoes,
    total_sincronizacoes: totalSincronizacoes,
    ultimas_sincronizacoes: sincronizacoes.slice(-5)
  });
});

// 📋 HISTÓRICO DE MOVIMENTAÇÕES
app.get('/historico-movimentacoes', (req, res) => {
  const limite = req.query.limite || 20;
  const historico = movimentacoes.slice(-limite);

  res.json({
    total: movimentacoes.length,
    limite,
    historico
  });
});

const PORT = process.env.PORT || 3003;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n📦 Squad-Estoque iniciado na porta ${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST /track-inventory`);
  console.log(`   - POST /reserve-material`);
  console.log(`   - POST /manage-catalog`);
  console.log(`   - POST /alert-low-stock`);
  console.log(`   - POST /sincronizar-estoque (NOVO - sincroniza com fornecedores)`);
  console.log(`   - GET /status-estoque (NOVO - status detalhado)`);
  console.log(`   - GET /historico-movimentacoes (NOVO - histórico)`);
  console.log(`   - GET /verificar-reserva\n`);
});

module.exports = app;
