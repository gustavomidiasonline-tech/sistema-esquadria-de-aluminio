/**
 * Script de teste: Verifica se perfis_catalogo está carregando corretamente
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gkklumrnzsnytlxscpll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x1bXJuenNueXRseHNjcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTAwOTEsImV4cCI6MjA4OTI4NjA5MX0.Yl4xH5BJ83rqR3Li67nMf38jPV2_rDmxGbnt0eQW3aE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPerfisLoad() {
  console.log('🔍 Testando carregamento de perfis_catalogo...\n');

  try {
    // 1. Verificar se tabela existe e tem dados
    console.log('1️⃣  Contando registros em perfis_catalogo:');
    const { data: countData, error: countError } = await supabase
      .from('perfis_catalogo')
      .select('*', { count: 'exact' });

    if (countError) {
      console.error('❌ Erro ao contar:', countError.message);
      return;
    }

    console.log(`   ✅ Total de registros: ${countData.length}`);

    // 2. Buscar primeiros 5 perfis
    console.log('\n2️⃣  Primeiros 5 perfis:');
    const { data: perfis, error: perfisError } = await supabase
      .from('perfis_catalogo')
      .select('id, codigo, nome')
      .limit(5);

    if (perfisError) {
      console.error('❌ Erro ao buscar perfis:', perfisError.message);
      return;
    }

    if (perfis.length === 0) {
      console.error('❌ Nenhum perfil encontrado!');
      return;
    }

    perfis.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.codigo} - ${p.nome}`);
    });

    // 3. Verificar o formato esperado pelo hook
    console.log('\n3️⃣  Testando formato que o hook espera (codigo as code, nome as description):');
    const { data: formatted, error: formatError } = await supabase
      .from('perfis_catalogo')
      .select('id, codigo as code, nome as description')
      .limit(3);

    if (formatError) {
      console.error('❌ Erro ao formatar:', formatError.message);
      return;
    }

    formatted.forEach((p, i) => {
      console.log(`   ${i + 1}. code="${p.code}", description="${p.description}"`);
    });

    // 4. Verificar se há problemas com RLS
    console.log('\n4️⃣  Checando se RLS está bloqueando:');
    const { data: rls } = await supabase
      .from('perfis_catalogo')
      .select('id, company_id')
      .limit(1);

    if (rls && rls.length > 0) {
      console.log(`   ✅ RLS permitiu acesso, company_id: ${rls[0].company_id || 'null'}`);
    }

    // 5. Status final
    console.log('\n✅ RESULTADO:');
    console.log(`   Total de perfis: ${perfis.length}`);
    console.log(`   Formato OK: ${formatted.length > 0 ? 'Sim' : 'Não'}`);
    console.log(`   RLS OK: ${rls && rls.length > 0 ? 'Sim' : 'Talvez bloqueando'}`);

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testPerfisLoad();
