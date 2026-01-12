import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function addUniqueEmailConstraint() {
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
    console.log('🔍 Verificando emails duplicados...\n');

    // Check for duplicate emails
    const [duplicates] = await connection.query(`
      SELECT email, COUNT(*) as count, GROUP_CONCAT(id) as user_ids, GROUP_CONCAT(role) as roles
      FROM users
      GROUP BY email
      HAVING count > 1
    `);

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      console.log('⚠️  Emails duplicados encontrados:');
      console.table(duplicates);

      console.log('\n🚨 ATENÇÃO: Há emails duplicados no banco!');
      console.log('Você precisa decidir qual usuário manter para cada email duplicado.');
      console.log('\nPara remover duplicatas, execute:');
      console.log('DELETE FROM users WHERE id = X; -- onde X é o ID do usuário a remover\n');

      return;
    }

    console.log('✅ Nenhum email duplicado encontrado!\n');

    // Check if unique constraint already exists
    const [indexes] = await connection.query(`
      SHOW INDEX FROM users WHERE Key_name = 'email' AND Non_unique = 0
    `);

    if (Array.isArray(indexes) && indexes.length > 0) {
      console.log('ℹ️  Constraint UNIQUE já existe na coluna email');
      return;
    }

    // Add unique constraint
    console.log('🔧 Adicionando constraint UNIQUE na coluna email...');
    await connection.query('ALTER TABLE users ADD UNIQUE INDEX email (email)');
    console.log('✅ Constraint UNIQUE adicionada com sucesso!\n');

    console.log('📋 Verificando constraint...');
    const [newIndexes] = await connection.query(`
      SHOW INDEX FROM users WHERE Column_name = 'email'
    `);
    console.table(newIndexes);

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addUniqueEmailConstraint().catch(console.error);
