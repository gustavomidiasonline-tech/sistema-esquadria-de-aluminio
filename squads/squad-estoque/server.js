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
  'aluminio_6063': { quantidade: 12, minimo: 5, unidade: 'm²', status: 'ok' },
  'vidro_temperado': { quantidade: 20, minimo: 10, unidade: 'unidades', status: 'ok' }
};

const reservas = [];

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

const PORT = process.env.PORT || 3003;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n📦 Squad-Estoque iniciado na porta ${PORT}`);
  console.log(`   Endpoints: track-inventory, reserve-material, manage-catalog, alert-low-stock\n`);
});

module.exports = app;
