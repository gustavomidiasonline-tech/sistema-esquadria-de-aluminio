#!/usr/bin/env node
/**
 * START ALL SQUADS - Inicializa todo o ecossistema
 * Executa todos os 8 squads em paralelo
 */

const { spawn } = require('child_process');
const path = require('path');

const SQUADS = [
  { name: '🏭 Squad-Producao', port: 3002, dir: 'squad-producao' },
  { name: '📦 Squad-Estoque', port: 3003, dir: 'squad-estoque' },
  { name: '👥 Squad-CRM', port: 3004, dir: 'squad-crm' },
  { name: '💰 Squad-Financeiro', port: 3005, dir: 'squad-financeiro' },
  { name: '📈 Squad-Dashboard', port: 3006, dir: 'squad-dashboard' },
  { name: '✅ Squad-Qualidade', port: 3007, dir: 'squad-qualidade' },
  { name: '🔧 Squad-Integradores', port: 3008, dir: 'squad-integradores' }
];

const ORQUESTRADOR = { name: '🎯 Orquestrador', port: 4000, dir: 'squad-aisistema-aliminio', file: 'orquestrador.js' };

console.log(`\n╔════════════════════════════════════════════════════════════╗`);
console.log(`║                                                            ║`);
console.log(`║      🚀 INICIANDO ECOSSISTEMA COMPLETO DE SQUADS 🚀       ║`);
console.log(`║                                                            ║`);
console.log(`║   Sistema ERP para Alumínio & Vidraçarias - ONLINE        ║`);
console.log(`║                                                            ║`);
console.log(`╚════════════════════════════════════════════════════════════╝\n`);

// Iniciar cada squad
const processos = [];

function startSquad(squad, file = 'server.js') {
  return new Promise((resolve) => {
    const dir = path.join(__dirname, 'squads', squad.dir);
    const filePath = path.join(dir, file);

    const child = spawn('node', [filePath], {
      cwd: dir,
      env: { ...process.env, PORT: squad.port }
    });

    child.on('error', (error) => {
      console.error(`❌ Erro iniciando ${squad.name}: ${error.message}`);
    });

    child.stdout.on('data', (data) => {
      process.stdout.write(`${data}`);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    processos.push({
      squad: squad.name,
      child,
      port: squad.port
    });

    resolve();
  });
}

async function iniciar() {
  console.log(`⏳ Iniciando 7 squads especializados em paralelo...\n`);

  // Iniciar todos os squads em paralelo
  await Promise.all(
    SQUADS.map(squad => startSquad(squad))
  );

  // Pequeno delay e depois iniciar orquestrador
  await new Promise(r => setTimeout(r, 2000));

  console.log(`\n⏳ Iniciando Orquestrador Central...\n`);
  await startSquad(ORQUESTRADOR, 'orquestrador.js');

  // Aguardar e exibir resumo
  await new Promise(r => setTimeout(r, 2000));

  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                  ✅ SISTEMA ONLINE                         ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  console.log(`📊 RESUMO DO SISTEMA:\n`);
  console.log(`7 Squads Especializados:`);
  SQUADS.forEach(s => {
    console.log(`  ✓ ${s.name.padEnd(25)} porta ${s.port}`);
  });

  console.log(`\n1 Orquestrador Central:`);
  console.log(`  ✓ ${ORQUESTRADOR.name.padEnd(25)} porta ${ORQUESTRADOR.port}`);

  console.log(`\n🔗 ENDPOINTS:\n`);
  console.log(`POST http://localhost:4000/processar-pedido`);
  console.log(`GET  http://localhost:4000/status-squads`);
  console.log(`GET  http://localhost:4000/health\n`);

  console.log(`📝 EXEMPLO DE USO:\n`);
  console.log(`curl -X POST http://localhost:4000/processar-pedido \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{`);
  console.log(`    "id": "PED-2024-001",`);
  console.log(`    "cliente_id": "CLI-001",`);
  console.log(`    "cliente_nome": "Vidraçaria Centro",`);
  console.log(`    "tipologia": "porta-correr-premium",`);
  console.log(`    "dimensoes": {"altura": 2100, "largura": 1500},`);
  console.log(`    "quantidade": 10,`);
  console.log(`    "material": "aluminio_6063"`);
  console.log(`  }'\n`);

  console.log(`⌨️  Pressione Ctrl+C para parar todos os squads\n`);
}

iniciar().catch(error => {
  console.error('❌ Erro ao iniciar:', error);
  process.exit(1);
});

// Cleanup ao sair
process.on('SIGINT', () => {
  console.log(`\n\n⏹️  Parando todos os squads...`);
  processos.forEach(p => p.child.kill());
  console.log(`✓ Sistema desligado\n`);
  process.exit(0);
});
