import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

console.log('🔍 Testando conexão Supabase...');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Check auth session
console.log('\n1️⃣ Verificando sessão...');
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  console.log('✅ Sessão ativa:', session.user.email);
} else {
  console.log('⚠️ Sem sessão autenticada');
}

// Test 2: Check get_user_company_id function
console.log('\n2️⃣ Testando função get_user_company_id()...');
try {
  const { data, error } = await supabase.rpc('get_user_company_id');
  if (error) {
    console.error('❌ Erro ao chamar get_user_company_id:', error.message);
  } else {
    console.log('✅ Função existe e retorna:', data);
  }
} catch (err) {
  console.error('❌ Erro:', err.message);
}

// Test 3: Try to select from inventory_items
console.log('\n3️⃣ Testando SELECT de inventory_items...');
try {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Erro:', error.code, error.message);
  } else {
    console.log('✅ SELECT funcionando');
    console.log(`   ${data?.length || 0} registros encontrados`);
  }
} catch (err) {
  console.error('❌ Erro:', err.message);
}

console.log('\n✨ Testes concluídos!');
