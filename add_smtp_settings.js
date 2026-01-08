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
    console.log('🔧 Adicionando campos SMTP em gym_settings...\n');

    // Verificar se as colunas já existem
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM gym_settings WHERE Field IN (
        'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword',
        'smtpFromEmail', 'smtpFromName', 'smtpUseTls', 'smtpUseSsl'
      )
    `);

    if (columns.length > 0) {
      console.log('✅ Campos SMTP já existem na tabela gym_settings!');
      console.log('\n📋 Campos encontrados:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}`);
      });
      return;
    }

    // Adicionar colunas SMTP
    await connection.query(`
      ALTER TABLE gym_settings
      ADD COLUMN smtpHost VARCHAR(255) DEFAULT NULL COMMENT 'Host do servidor SMTP (ex: smtp.gmail.com)',
      ADD COLUMN smtpPort INT(11) DEFAULT 587 COMMENT 'Porta SMTP (587 para TLS, 465 para SSL)',
      ADD COLUMN smtpUser VARCHAR(255) DEFAULT NULL COMMENT 'Usuário/email para autenticação SMTP',
      ADD COLUMN smtpPassword VARCHAR(500) DEFAULT NULL COMMENT 'Senha do servidor SMTP',
      ADD COLUMN smtpFromEmail VARCHAR(255) DEFAULT NULL COMMENT 'Email remetente',
      ADD COLUMN smtpFromName VARCHAR(255) DEFAULT 'Academia' COMMENT 'Nome do remetente',
      ADD COLUMN smtpUseTls TINYINT(1) DEFAULT 1 COMMENT 'Usar TLS (porta 587)',
      ADD COLUMN smtpUseSsl TINYINT(1) DEFAULT 0 COMMENT 'Usar SSL (porta 465)'
    `);

    console.log('✅ Campos SMTP adicionados com sucesso!\n');

    // Verificar estrutura atualizada
    const [newColumns] = await connection.query(`
      SHOW COLUMNS FROM gym_settings WHERE Field LIKE 'smtp%'
    `);

    console.log('📋 Novos campos adicionados:');
    newColumns.forEach(col => {
      console.log(`  ✓ ${col.Field} (${col.Type})`);
    });

    console.log('\n🎉 Migração concluída!');
    console.log('\n💡 Agora você pode configurar o SMTP no painel administrativo.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addSmtpSettings().catch(console.error);
