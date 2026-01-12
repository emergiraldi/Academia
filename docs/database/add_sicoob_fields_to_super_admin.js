/**
 * Adiciona campos Sicoob ao superAdminSettings
 * Execute: node add_sicoob_fields_to_super_admin.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function addSicoobFields() {
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
    console.log('🔧 Adicionando campos Sicoob ao superAdminSettings...\n');

    // Verificar se os campos já existem
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM superAdminSettings LIKE 'pixProvider'
    `);

    if (columns.length > 0) {
      console.log('✅ Campos Sicoob já existem na tabela!');
      return;
    }

    // Adicionar novos campos
    await connection.query(`
      ALTER TABLE superAdminSettings
      ADD COLUMN pixProvider VARCHAR(50) DEFAULT 'sicoob' COMMENT 'Provedor PIX (efi, sicoob, other)' AFTER id,
      ADD COLUMN pixPrivateKey TEXT COMMENT 'Chave privada completa (conteúdo PEM)' AFTER pixCertificate,
      ADD COLUMN pixApiUrl VARCHAR(500) COMMENT 'URL da API PIX (Sicoob)' AFTER merchantCity,
      ADD COLUMN pixTokenUrl VARCHAR(500) COMMENT 'URL do endpoint de token OAuth' AFTER pixApiUrl,
      ADD COLUMN bankCode VARCHAR(10) COMMENT 'Código do banco (756 para Sicoob)' AFTER pixTokenUrl
    `);

    console.log('✅ Campos Sicoob adicionados com sucesso!');
    console.log('\n📋 Novos campos:');
    console.log('   - pixProvider: Provedor PIX (sicoob/efi)');
    console.log('   - pixPrivateKey: Chave privada PIX');
    console.log('   - pixApiUrl: URL da API PIX');
    console.log('   - pixTokenUrl: URL do OAuth token');
    console.log('   - bankCode: Código do banco\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addSicoobFields().catch(console.error);
