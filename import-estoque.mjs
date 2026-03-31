/**
 * Script de importação: CSV → Supabase inventory_items
 * Corrige encoding e importa 200 itens do estoque
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  'https://gkklumrnzsnytlxscpll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x1bXJuenNueXRseHNjcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTAwOTEsImV4cCI6MjA4OTI4NjA5MX0.Yl4xH5BJ83rqR3Li67nMf38jPV2_rDmxGbnt0eQW3aE'
);

// Mapa de tipos para normalizar
const tipoMap = {
  'Perfil': 'perfil',
  'Vidro': 'vidro',
  'Ferragem': 'ferragem',
  'Acessório': 'acessorio',
  'AcessÃ³rio': 'acessorio',
};

// Função para corrigir encoding UTF-8
function fixEncoding(str) {
  if (!str) return str;
  try {
    // Tenta decodificar como ISO-8859-1 (Latin-1)
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch {
    return str;
  }
}

async function importEstoque() {
  console.log('📥 Iniciando importação de estoque...\n');

  try {
    // 0. Pegar company_id (bypass RLS - usar service role se necessário)
    // Para importação inicial, vou inserir diretamente sem company_id
    // As policies permitem isso em alguns casos

    // 1. Ler CSV
    const csvPath = path.join(__dirname, 'estoque_200_itens_completo.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('❌ Arquivo não encontrado:', csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const header = lines[0].split(',');

    console.log(`📋 CSV carregado: ${lines.length} linhas (1 header + ${lines.length - 1} itens)\n`);

    // 2. Preparar dados
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const item = {};

      header.forEach((key, idx) => {
        item[key.trim()] = values[idx]?.trim() || '';
      });

      // Corrigir encoding e normalizar dados
      const codigo = fixEncoding(item.codigo);
      const nome = fixEncoding(item.nome);
      const tipoRaw = fixEncoding(item.tipo);
      const tipo = tipoMap[tipoRaw] || 'outro';
      const quantidade = parseFloat(item.quantidade) || 0;
      const unidade = fixEncoding(item.unidade);

      items.push({
        codigo,
        nome,
        tipo,
        quantidade_disponivel: quantidade,
        quantidade_reservada: 0,
        quantidade_minima: 0,
        unidade,
        localizacao: null,
        company_id: null, // Será preenchido pelo RLS
      });
    }

    console.log(`✅ ${items.length} itens preparados para importação\n`);

    // 3. Mostrar amostra
    console.log('📊 Amostra dos itens:');
    items.slice(0, 3).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.codigo} - ${item.nome} (${item.tipo}, ${item.quantidade_disponivel} ${item.unidade})`);
    });
    console.log(`   ... (${items.length - 3} itens mais)\n`);

    // 4. Limpar tabela (CUIDADO!)
    console.log('🧹 Limpando inventory_items existentes...');
    const { error: deleteError } = await supabase
      .from('inventory_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo

    if (deleteError && !deleteError.message.includes('no rows')) {
      console.warn('⚠️  Aviso ao limpar:', deleteError.message);
    }

    // 5. Inserir em lotes (Supabase tem limite)
    console.log('📤 Importando itens em lotes...');
    const batchSize = 50;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error.message);
        errors += batch.length;
      } else {
        imported += data?.length || 0;
        console.log(`   ✅ Lote ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} itens`);
      }
    }

    // 6. Resultado final
    console.log(`\n✨ IMPORTAÇÃO COMPLETA!`);
    console.log(`   Importados: ${imported}/${items.length}`);
    if (errors > 0) {
      console.log(`   Erros: ${errors}`);
    }

    // 7. Verificar
    console.log('\n🔍 Verificando dados importados...');
    const { data: allItems } = await supabase
      .from('inventory_items')
      .select('tipo')
      .limit(1000);

    const tipoCount = {};
    allItems.forEach(item => {
      tipoCount[item.tipo] = (tipoCount[item.tipo] || 0) + 1;
    });

    console.log('   Itens por tipo:');
    Object.entries(tipoCount).forEach(([tipo, count]) => {
      console.log(`   - ${tipo}: ${count}`);
    });

    console.log('\n✅ Estoque pronto para usar!');

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

importEstoque();
