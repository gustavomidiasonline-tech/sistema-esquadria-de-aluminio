/**
 * Teste: Carregar perfis de inventory_items
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gkklumrnzsnytlxscpll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x1bXJuenNueXRseHNjcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTAwOTEsImV4cCI6MjA4OTI4NjA5MX0.Yl4xH5BJ83rqR3Li67nMf38jPV2_rDmxGbnt0eQW3aE'
);

async function testInventoryProfiles() {
  console.log('🔍 Testando carregamento de PERFIS de inventory_items...\n');

  try {
    // 1. Contar perfis
    console.log('1️⃣  Contando perfis:');
    const { data: countData } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .eq('tipo', 'perfil');

    console.log(`   ✅ Total de perfis: ${countData.length}`);

    // 2. Buscar primeiros 10
    console.log('\n2️⃣  Primeiros 10 perfis:');
    const { data: perfis } = await supabase
      .from('inventory_items')
      .select('id, codigo, nome')
      .eq('tipo', 'perfil')
      .order('codigo')
      .limit(10);

    if (perfis && perfis.length > 0) {
      perfis.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.codigo} - ${p.nome}`);
      });
    } else {
      console.error('   ❌ Nenhum perfil encontrado!');
      return;
    }

    // 3. Testar o formato que o hook espera
    console.log('\n3️⃣  Formato para o hook (codigo as code, nome as description):');
    const { data: formatted } = await supabase
      .from('inventory_items')
      .select('id, codigo as code, nome as description')
      .eq('tipo', 'perfil')
      .order('codigo')
      .limit(3);

    formatted.forEach((p, i) => {
      console.log(`   ${i + 1}. code="${p.code}", desc="${p.description}"`);
    });

    console.log('\n✅ SUCESSO! Os perfis estão carregando corretamente!');
    console.log(`   Total: ${perfis.length} perfis disponíveis`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

testInventoryProfiles();
