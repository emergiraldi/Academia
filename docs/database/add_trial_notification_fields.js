/**
 * Adiciona campos de configuração de notificações de trial ao superAdminSettings
 * Execute: node add_trial_notification_fields.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function addTrialNotificationFields() {
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
    console.log('🔧 Adicionando campos de notificação de trial ao superAdminSettings...\n');

    // Verificar se os campos já existem
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM superAdminSettings LIKE 'trialWarningDays'
    `);

    if (columns.length > 0) {
      console.log('✅ Campos de notificação de trial já existem na tabela!');
      return;
    }

    // Adicionar novos campos
    await connection.query(`
      ALTER TABLE superAdminSettings
      ADD COLUMN trialWarningDays INT NOT NULL DEFAULT 3 COMMENT 'Quantos dias antes do trial acabar para enviar email de aviso' AFTER trialDays,
      ADD COLUMN trialGracePeriodDays INT NOT NULL DEFAULT 7 COMMENT 'Quantos dias após trial acabar antes de bloquear academia' AFTER trialWarningDays
    `);

    console.log('✅ Campos de notificação de trial adicionados com sucesso!');
    console.log('\n📋 Novos campos:');
    console.log('   - trialWarningDays: Quantos dias ANTES do trial acabar enviar aviso (padrão: 3)');
    console.log('   - trialGracePeriodDays: Quantos dias DEPOIS do trial acabar antes de bloquear (padrão: 7)\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addTrialNotificationFields().catch(console.error);
