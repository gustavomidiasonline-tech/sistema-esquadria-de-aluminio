/**
 * Script: Procura qual tabela contém os 200 itens do estoque
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gkklumrnzsnytlxscpll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x1bXJuenNueXRseHNjcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTAwOTEsImV4cCI6MjA4OTI4NjA5MX0.Yl4xH5BJ83rqR3Li67nMf38jPV2_rDmxGbnt0eQW3aE'
);

async function findInventoryTable() {
  console.log('🔍 Procurando tabelas com dados de estoque...\n');

  const possibleTables = [
    'inventory_items',
    'produtos',
    'materials',
    'catalog',
    'perfis',
    'mt_inventory',
    'estoque',
    'inventory',
    'catalog_items',
    'products',
  ];

  for (const table of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (!error && data) {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact' });

        console.log(`✅ ${table}: ${count} registros`);

        if (count > 0) {
          const { data: sample } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          console.log(`   Colunas: ${Object.keys(sample[0] || {}).join(', ')}`);
          console.log(`   Amostra: ${JSON.stringify(sample[0] || {}, null, 2).substring(0, 200)}...\n`);
        }
      }
    } catch (err) {
      // Silently skip non-existent tables
    }
  }
}

findInventoryTable();
