import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrateStudentAddressFields() {
  const databaseUrl = process.env.DATABASE_URL;

  let config;

  if (databaseUrl && databaseUrl.includes('@')) {
    console.log('📋 Using DATABASE_URL');

    let match = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (match) {
      const [, user, password, host, port, database] = match;
      config = { host, port: parseInt(port), user, password, database };
    } else {
      match = databaseUrl.match(/mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!match) {
        console.error('❌ Invalid DATABASE_URL format');
        process.exit(1);
      }
      const [, user, host, port, database] = match;
      config = { host, port: parseInt(port), user, password: '', database };
    }
  } else {
    console.log('📋 Using localhost config');
    config = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'academia_db'
    };
  }

  const conn = await mysql.createConnection(config);

  try {
    console.log('🔧 Adicionando campos de endereço à tabela students...\n');

    // Check if columns already exist
    const [columns] = await conn.execute('DESCRIBE students');
    const columnNames = columns.map(col => col.Field);

    const fieldsToAdd = [];
    if (!columnNames.includes('number')) fieldsToAdd.push('number');
    if (!columnNames.includes('complement')) fieldsToAdd.push('complement');
    if (!columnNames.includes('neighborhood')) fieldsToAdd.push('neighborhood');

    if (fieldsToAdd.length === 0) {
      console.log('✅ Todos os campos já existem!');
      return;
    }

    console.log(`📝 Campos a adicionar: ${fieldsToAdd.join(', ')}\n`);

    // Add missing columns
    if (fieldsToAdd.includes('number')) {
      await conn.execute(`
        ALTER TABLE students
        ADD COLUMN number VARCHAR(20) NULL AFTER address
      `);
      console.log('✓ Campo "number" adicionado');
    }

    if (fieldsToAdd.includes('complement')) {
      await conn.execute(`
        ALTER TABLE students
        ADD COLUMN complement VARCHAR(100) NULL AFTER number
      `);
      console.log('✓ Campo "complement" adicionado');
    }

    if (fieldsToAdd.includes('neighborhood')) {
      await conn.execute(`
        ALTER TABLE students
        ADD COLUMN neighborhood VARCHAR(100) NULL AFTER complement
      `);
      console.log('✓ Campo "neighborhood" adicionado');
    }

    console.log('\n✅ Migration concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrateStudentAddressFields();
