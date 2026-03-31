import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gkklumrnzsnytlxscpll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x1bXJuenNueXRseHNjcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTAwOTEsImV4cCI6MjA4OTI4NjA5MX0.Yl4xH5BJ83rqR3Li67nMf38jPV2_rDmxGbnt0eQW3aE'
);

async function findMat0158() {
  console.log('🔍 Procurando por "MAT0158"...\n');

  const possibleTables = [
    'inventory_items', 'products', 'mt_products', 'catalog_items',
    'perfis_catalogo', 'materiais', 'items', 'estoque_items',
    'catalog_products', 'product_catalog', 'material_items'
  ];

  for (const table of possibleTables) {
    try {
      // Procura em colunas que podem ter o código
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .or(`codigo.ilike.%MAT0158%,code.ilike.%MAT0158%,sku.ilike.%MAT0158%,id.ilike.%MAT0158%`)
        .limit(1);

      if (!error && data && data.length > 0) {
        console.log(`✅ ENCONTRADO em "${table}":`);
        console.log(JSON.stringify(data[0], null, 2));
        return;
      }
    } catch (err) {
      // Silent fail
    }
  }

  console.log('❌ "MAT0158" não encontrado em nenhuma tabela');

  // Tenta buscar tudo em inventory_items
  console.log('\n2️⃣  Verificando estrutura de inventory_items:');
  const { data: structure } = await supabase
    .from('inventory_items')
    .select('*')
    .limit(1);

  if (structure && structure.length > 0) {
    console.log('   Colunas:', Object.keys(structure[0]));
  } else {
    console.log('   Tabela está vazia!');
  }
}

findMat0158();
