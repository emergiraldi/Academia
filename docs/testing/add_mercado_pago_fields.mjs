import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'academia',
  password: 'Academia2026Secure',
  database: 'academia_db'
});

console.log('\n🔧 MIGRAÇÃO: Adicionando campos Mercado Pago à tabela bank_accounts...\n');

try {
  // 1. Verificar e adicionar coluna pix_provedor (padrão: 'sicoob' para não quebrar dados existentes)
  console.log('📌 Verificando coluna pix_provedor...');
  const [columns1] = await conn.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'academia_db'
    AND TABLE_NAME = 'bank_accounts'
    AND COLUMN_NAME = 'pix_provedor'
  `);

  if (columns1.length === 0) {
    await conn.execute(`
      ALTER TABLE bank_accounts
      ADD COLUMN pix_provedor VARCHAR(20) DEFAULT 'sicoob'
      AFTER pix_ativo
    `);
    console.log('✅ Coluna pix_provedor adicionada com sucesso!');
  } else {
    console.log('ℹ️  Coluna pix_provedor já existe, pulando...');
  }

  // 2. Atualizar registros existentes para terem pix_provedor = 'sicoob'
  console.log('\n📌 Garantindo que registros existentes tenham pix_provedor = "sicoob"...');
  const [updateResult] = await conn.execute(`
    UPDATE bank_accounts
    SET pix_provedor = 'sicoob'
    WHERE pix_provedor IS NULL OR pix_provedor = ''
  `);
  console.log(`✅ ${updateResult.affectedRows} registro(s) atualizado(s) com sucesso!`);

  // 3. Verificar e adicionar coluna mp_access_token
  console.log('\n📌 Verificando coluna mp_access_token...');
  const [columns2] = await conn.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'academia_db'
    AND TABLE_NAME = 'bank_accounts'
    AND COLUMN_NAME = 'mp_access_token'
  `);

  if (columns2.length === 0) {
    await conn.execute(`
      ALTER TABLE bank_accounts
      ADD COLUMN mp_access_token TEXT NULL
      AFTER pix_url_token
    `);
    console.log('✅ Coluna mp_access_token adicionada com sucesso!');
  } else {
    console.log('ℹ️  Coluna mp_access_token já existe, pulando...');
  }

  // 4. Verificar e adicionar coluna mp_public_key
  console.log('\n📌 Verificando coluna mp_public_key...');
  const [columns3] = await conn.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'academia_db'
    AND TABLE_NAME = 'bank_accounts'
    AND COLUMN_NAME = 'mp_public_key'
  `);

  if (columns3.length === 0) {
    await conn.execute(`
      ALTER TABLE bank_accounts
      ADD COLUMN mp_public_key TEXT NULL
      AFTER mp_access_token
    `);
    console.log('✅ Coluna mp_public_key adicionada com sucesso!');
  } else {
    console.log('ℹ️  Coluna mp_public_key já existe, pulando...');
  }

  // 5. Verificar resultado final
  console.log('\n📊 Verificando estrutura atualizada...');
  const [columns] = await conn.execute(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'academia_db'
    AND TABLE_NAME = 'bank_accounts'
    AND COLUMN_NAME IN ('pix_provedor', 'mp_access_token', 'mp_public_key')
    ORDER BY ORDINAL_POSITION
  `);

  console.log('\n┌─────────────────────┬──────────────┬─────────────┬──────────────┐');
  console.log('│ Coluna              │ Tipo         │ Padrão      │ Nullable     │');
  console.log('├─────────────────────┼──────────────┼─────────────┼──────────────┤');
  for (const col of columns) {
    const name = String(col.COLUMN_NAME).padEnd(19);
    const type = String(col.DATA_TYPE).padEnd(12);
    const defaultVal = (col.COLUMN_DEFAULT || 'NULL').substring(0, 11).padEnd(11);
    const nullable = String(col.IS_NULLABLE).padEnd(12);
    console.log(`│ ${name} │ ${type} │ ${defaultVal} │ ${nullable} │`);
  }
  console.log('└─────────────────────┴──────────────┴─────────────┴──────────────┘');

  // 6. Verificar dados existentes
  console.log('\n📋 Verificando contas bancárias existentes...');
  const [accounts] = await conn.execute(`
    SELECT id, gymId, banco, pix_ativo, pix_provedor,
           CASE WHEN mp_access_token IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_mp_token
    FROM bank_accounts
    ORDER BY id
  `);

  if (accounts.length > 0) {
    console.log(`\n✅ Encontradas ${accounts.length} conta(s) bancária(s):`);
    console.log('\n┌─────┬────────┬────────┬───────────┬──────────────┬──────────────┐');
    console.log('│ ID  │ GymID  │ Banco  │ PIX Ativo │ Provedor     │ Tem MP Token │');
    console.log('├─────┼────────┼────────┼───────────┼──────────────┼──────────────┤');
    for (const acc of accounts) {
      const id = String(acc.id).padEnd(3);
      const gymId = String(acc.gymId).padEnd(6);
      const banco = String(acc.banco).padEnd(6);
      const pixAtivo = String(acc.pix_ativo).padEnd(9);
      const provedor = String(acc.pix_provedor || 'sicoob').padEnd(12);
      const temMp = String(acc.tem_mp_token).padEnd(12);
      console.log(`│ ${id} │ ${gymId} │ ${banco} │ ${pixAtivo} │ ${provedor} │ ${temMp} │`);
    }
    console.log('└─────┴────────┴────────┴───────────┴──────────────┴──────────────┘');
  } else {
    console.log('⚠️  Nenhuma conta bancária encontrada.');
  }

  console.log('\n========================================');
  console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('========================================');
  console.log('\n📝 Resumo das alterações:');
  console.log('   • Coluna "pix_provedor" adicionada (padrão: sicoob)');
  console.log('   • Coluna "mp_access_token" adicionada');
  console.log('   • Coluna "mp_public_key" adicionada');
  console.log('   • Dados existentes do Sicoob preservados ✅');
  console.log('\n💡 Próximos passos:');
  console.log('   1. Compile o projeto: npm run build');
  console.log('   2. Reinicie o backend: pm2 restart academia-api');
  console.log('   3. Acesse: https://sysfitpro.com.br/admin/bank-accounts');
  console.log('   4. Configure suas credenciais Mercado Pago\n');

} catch (error) {
  console.error('\n❌ ERRO durante a migração:', error.message);
  console.error('\n💡 Possíveis causas:');
  console.error('   • Banco de dados não está rodando');
  console.error('   • Credenciais incorretas');
  console.error('   • Tabela bank_accounts não existe');
  process.exit(1);
} finally {
  await conn.end();
}
