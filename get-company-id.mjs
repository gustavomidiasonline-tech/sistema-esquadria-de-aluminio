import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gkklumrnzsnytlxscpll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x1bXJuenNueXRseHNjcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTAwOTEsImV4cCI6MjA4OTI4NjA5MX0.Yl4xH5BJ83rqR3Li67nMf38jPV2_rDmxGbnt0eQW3aE'
);

async function getCompanyId() {
  console.log('🔍 Procurando company_id...\n');

  // Tentar pegar primeira company existente
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .limit(1);

  if (companies && companies.length > 0) {
    console.log(`✅ Empresa encontrada:`);
    console.log(`   ID: ${companies[0].id}`);
    console.log(`   Nome: ${companies[0].name}`);
    return companies[0].id;
  }

  // Se não tiver nenhuma, criar uma padrão
  console.log('⚠️  Nenhuma empresa encontrada. Criando padrão...');
  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({ name: 'Empresa Padrão' })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro:', error.message);
    return null;
  }

  console.log(`✅ Empresa criada:`);
  console.log(`   ID: ${newCompany.id}`);
  console.log(`   Nome: ${newCompany.name}`);
  return newCompany.id;
}

getCompanyId().then(id => {
  if (id) {
    console.log(`\n📋 Use este company_id na migração: "${id}"`);
  }
});
