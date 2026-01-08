/**
 * Adiciona campo de logo à tabela gym_settings
 * Execute: node add_gym_logo.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function addGymLogo() {
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
    console.log('🎨 Adicionando campo de logo em gym_settings...\n');

    // Verificar se o campo já existe
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM gym_settings WHERE Field = 'logoUrl'
    `);

    if (columns.length > 0) {
      console.log('✅ Campo logoUrl já existe na tabela gym_settings!');
      return;
    }

    // Adicionar campo logoUrl
    await connection.query(`
      ALTER TABLE gym_settings
      ADD COLUMN logoUrl VARCHAR(500) DEFAULT NULL
      COMMENT 'URL do logo da academia (pode ser URL do S3 ou data:image base64)'
    `);

    console.log('✅ Campo logoUrl adicionado com sucesso!');
    console.log('\n📝 Agora você pode:');
    console.log('   1. Ir em /admin/settings');
    console.log('   2. Fazer upload do logo da academia');
    console.log('   3. O logo aparecerá no app do aluno/professor');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addGymLogo().catch(console.error);
