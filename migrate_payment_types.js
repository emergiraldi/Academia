import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function migratePaymentTypes() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
  const url = new URL(dbUrl);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1)
  });

  try {
    console.log('🔄 Iniciando migração da coluna type da tabela payment_methods...\n');

    // 1. Verificar dados existentes
    console.log('📋 Dados existentes:');
    const [existingData] = await connection.query('SELECT id, name, type FROM payment_methods');
    console.table(existingData);

    // 2. Alterar a coluna para VARCHAR temporariamente
    console.log('\n🔧 Alterando coluna type para VARCHAR...');
    await connection.query('ALTER TABLE payment_methods MODIFY COLUMN type VARCHAR(50) NOT NULL');
    console.log('✅ Coluna alterada para VARCHAR');

    // 3. Atualizar valores existentes
    console.log('\n🔄 Atualizando valores existentes...');
    await connection.query("UPDATE payment_methods SET type = 'credit_card' WHERE type = 'credit'");
    await connection.query("UPDATE payment_methods SET type = 'debit_card' WHERE type = 'debit'");
    console.log('✅ Valores atualizados');

    // 4. Alterar de volta para ENUM com os novos valores
    console.log('\n🔧 Alterando coluna type para ENUM com novos valores...');
    await connection.query(`
      ALTER TABLE payment_methods
      MODIFY COLUMN type ENUM('cash', 'bank_transfer', 'credit_card', 'debit_card', 'pix', 'check', 'other') NOT NULL
    `);
    console.log('✅ Coluna alterada para ENUM com novos valores');

    // 5. Verificar resultado final
    console.log('\n📋 Dados após migração:');
    const [finalData] = await connection.query('SELECT id, name, type FROM payment_methods');
    console.table(finalData);

    console.log('\n✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migratePaymentTypes().catch(console.error);
