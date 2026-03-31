import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gkklumrnzsnytlxscpll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x1bXJuenNueXRseHNjcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTAwOTEsImV4cCI6MjA4OTI4NjA5MX0.Yl4xH5BJ83rqR3Li67nMf38jPV2_rDmxGbnt0eQW3aE'
);

async function checkTypes() {
  console.log('🔍 Verificando tipos em inventory_items...\n');

  try {
    // 1. Contar total
    const { data: all } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact' });

    console.log(`Total de itens: ${all.length}\n`);

    // 2. Listar todos os tipos únicos
    const { data: items } = await supabase
      .from('inventory_items')
      .select('tipo')
      .limit(300);

    const tiposMap = {};
    items.forEach(item => {
      tiposMap[item.tipo] = (tiposMap[item.tipo] || 0) + 1;
    });

    console.log('Tipos e quantidade:');
    Object.entries(tiposMap).forEach(([tipo, count]) => {
      console.log(`  - ${tipo}: ${count} itens`);
    });

    // 3. Ver algumas amostras de cada tipo
    console.log('\nAmostras por tipo:');
    for (const tipo of Object.keys(tiposMap)) {
      const { data: samples } = await supabase
        .from('inventory_items')
        .select('codigo, nome, tipo')
        .eq('tipo', tipo)
        .limit(2);

      console.log(`\n  ${tipo}:`);
      samples.forEach(s => {
        console.log(`    - ${s.codigo}: ${s.nome}`);
      });
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

checkTypes();
