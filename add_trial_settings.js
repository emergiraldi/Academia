/**
 * Adiciona configurações de trial period ao superAdminSettings
 * Execute: node add_trial_settings.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function addTrialSettings() {
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
    console.log('🔧 Adicionando campos de configuração de trial ao superAdminSettings...\n');

    // Verificar se os campos já existem
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM superAdminSettings LIKE 'trialEnabled'
    `);

    if (columns.length > 0) {
      console.log('✅ Campos de trial já existem na tabela!');
      return;
    }

    // Adicionar novos campos
    await connection.query(`
      ALTER TABLE superAdminSettings
      ADD COLUMN trialEnabled BOOLEAN DEFAULT TRUE NOT NULL COMMENT 'Se o período de teste está ativo',
      ADD COLUMN trialDays INT DEFAULT 14 NOT NULL COMMENT 'Quantos dias de teste grátis'
    `);

    console.log('✅ Campos de trial adicionados com sucesso!');
    console.log('\n📋 Novos campos:');
    console.log('   - trialEnabled: Habilita/desabilita período de teste');
    console.log('   - trialDays: Quantidade de dias de teste (padrão: 14)\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addTrialSettings().catch(console.error);
