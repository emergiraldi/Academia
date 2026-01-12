import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function createTables() {
  try {
    console.log('🗄️  Criando tabelas no banco de dados...\n');

    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
    const match = dbUrl.match(/mysql:\/\/([^:]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('DATABASE_URL inválida');
    }

    const [, user, password, host, port, database] = match;

    const connection = await mysql.createConnection({
      host,
      user,
      password: password || '',
      database,
      multipleStatements: true,
    });

    console.log('✅ Conectado ao banco de dados\n');

    // Read SQL file
    const sql = readFileSync('create_new_tables.sql', 'utf-8');

    // Execute SQL
    console.log('📝 Executando SQL...\n');
    await connection.query(sql);

    console.log('✅ Tabelas criadas com sucesso!\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    process.exit(1);
  }
}

createTables();
