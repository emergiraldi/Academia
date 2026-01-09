/**
 * Adiciona configurações de SMTP ao superAdminSettings
 * Execute: node add_smtp_settings.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function addSmtpSettings() {
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
    console.log('🔧 Adicionando campos de configuração SMTP ao superAdminSettings...\n');

    // Verificar se os campos já existem
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM superAdminSettings LIKE 'smtpHost'
    `);

    if (columns.length > 0) {
      console.log('✅ Campos de SMTP já existem na tabela!');
      return;
    }

    // Adicionar novos campos
    await connection.query(`
      ALTER TABLE superAdminSettings
      ADD COLUMN smtpHost VARCHAR(255) COMMENT 'Servidor SMTP (ex: smtp.gmail.com)',
      ADD COLUMN smtpPort INT DEFAULT 587 COMMENT 'Porta SMTP (587=TLS, 465=SSL)',
      ADD COLUMN smtpUser VARCHAR(255) COMMENT 'Usuário SMTP (email)',
      ADD COLUMN smtpPassword VARCHAR(255) COMMENT 'Senha SMTP ou App Password',
      ADD COLUMN smtpFromEmail VARCHAR(255) COMMENT 'Email remetente',
      ADD COLUMN smtpFromName VARCHAR(255) COMMENT 'Nome do remetente',
      ADD COLUMN smtpUseTls BOOLEAN DEFAULT TRUE COMMENT 'Usar STARTTLS (porta 587)',
      ADD COLUMN smtpUseSsl BOOLEAN DEFAULT FALSE COMMENT 'Usar SSL direto (porta 465)'
    `);

    console.log('✅ Campos de SMTP adicionados com sucesso!');
    console.log('\n📋 Novos campos:');
    console.log('   - smtpHost: Servidor SMTP (ex: smtp.gmail.com)');
    console.log('   - smtpPort: Porta SMTP (587 para TLS, 465 para SSL)');
    console.log('   - smtpUser: Usuário/email SMTP');
    console.log('   - smtpPassword: Senha ou App Password');
    console.log('   - smtpFromEmail: Email que aparece como remetente');
    console.log('   - smtpFromName: Nome que aparece como remetente');
    console.log('   - smtpUseTls: Usar STARTTLS (padrão: TRUE)');
    console.log('   - smtpUseSsl: Usar SSL direto (padrão: FALSE)\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addSmtpSettings().catch(console.error);
