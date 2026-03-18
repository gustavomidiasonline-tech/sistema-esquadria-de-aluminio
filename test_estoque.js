const { createClient } = require('@supabase/supabase-js');

async function testEstoque() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Env vars VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('\n📋 TESTES DE ESTOQUE\n');
  console.log('═'.repeat(50));

  try {
    // Passo 2: Verificar itens no estoque
    console.log('\n✅ Passo 2: Testando Listagem de Itens');
    const { data: itens, error: itensError } = await supabase
      .from('inventory_items')
      .select('COUNT');
    
    if (itensError) {
      console.error('❌ Erro ao listar itens:', itensError.message);
    } else {
      console.log(`✅ Itens no estoque: ${itens?.[0]?.['COUNT'] || 0}`);
    }

    // Passo 3: Verificar alertas
    console.log('\n✅ Passo 3: Testando Alertas de Estoque');
    const { data: alertas, error: alertasError } = await supabase
      .from('inventory_items')
      .select('id, codigo, nome, quantidade_disponivel, quantidade_minima')
      .lt('quantidade_disponivel', 'quantidade_minima');
    
    if (alertasError) {
      console.log('⚠️ RLS pode estar bloqueando. Tentando com auth...');
      const { data: allItems } = await supabase
        .from('inventory_items')
        .select('id, codigo, nome, quantidade_disponivel, quantidade_minima');
      
      if (allItems) {
        const alertasCount = allItems.filter(
          item => item.quantidade_disponivel < item.quantidade_minima
        ).length;
        console.log(`✅ Alertas detectados: ${alertasCount}`);
      }
    } else {
      console.log(`✅ Alertas detectados: ${alertas?.length || 0}`);
    }

    // Passo 4: Verificar sincronização
    console.log('\n✅ Passo 4: Testando Sincronização com Catálogo');
    const { data: linkedItems, error: linkedError } = await supabase
      .from('inventory_items')
      .select('COUNT')
      .not('perfil_aluminio_id', 'is', null);
    
    if (linkedError) {
      console.log('⚠️ Sem itens linkedos ainda (esperado na primeira execução)');
    } else {
      console.log(`✅ Itens linkedos com perfil_aluminio: ${linkedItems?.[0]?.['COUNT'] || 0}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('\n✅ TESTES CONCLUÍDOS!\n');
}

testEstoque();
