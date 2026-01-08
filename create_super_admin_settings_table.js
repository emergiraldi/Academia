/**
 * Cria tabela superAdminSettings para configurações bancárias do Super Admin
 * Execute: node create_super_admin_settings_table.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function createSuperAdminSettingsTable() {
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
    console.log('🏗️  Criando tabela superAdminSettings...\n');

    // Verificar se a tabela já existe
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'superAdminSettings'
    `);

    if (tables.length > 0) {
      console.log('✅ Tabela superAdminSettings já existe!');
      return;
    }

    // Criar tabela superAdminSettings
    await connection.query(`
      CREATE TABLE superAdminSettings (
        id INT AUTO_INCREMENT PRIMARY KEY,

        pixClientId VARCHAR(255) COMMENT 'Client ID da API Efí Pay',
        pixClientSecret VARCHAR(255) COMMENT 'Client Secret da API Efí Pay',
        pixCertificate TEXT COMMENT 'Certificado em base64 da API Efí Pay',
        pixKey VARCHAR(255) COMMENT 'Chave PIX do Super Admin para receber pagamentos',
        pixKeyType ENUM('cpf', 'cnpj', 'email', 'phone', 'random') COMMENT 'Tipo da chave PIX',
        merchantName VARCHAR(200) COMMENT 'Nome que aparece no QR Code PIX',
        merchantCity VARCHAR(100) COMMENT 'Cidade do beneficiário PIX',

        bankName VARCHAR(100) COMMENT 'Nome do banco (opcional)',
        bankAccount VARCHAR(50) COMMENT 'Número da conta (opcional)',
        bankAgency VARCHAR(20) COMMENT 'Agência (opcional)',

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Configurações bancárias do Super Admin para receber pagamentos de assinaturas'
    `);

    console.log('✅ Tabela superAdminSettings criada com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Acessar Super Admin > Configurações');
    console.log('   2. Configurar chave PIX e dados da Efí Pay');
    console.log('   3. Academias pagarão assinatura usando este PIX\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createSuperAdminSettingsTable().catch(console.error);
