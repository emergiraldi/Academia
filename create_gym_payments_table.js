/**
 * Cria tabela gymPayments para rastrear pagamentos de assinatura das academias
 * Execute: node create_gym_payments_table.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function createGymPaymentsTable() {
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
    console.log('🏗️  Criando tabela gymPayments...\n');

    // Verificar se a tabela já existe
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'gymPayments'
    `);

    if (tables.length > 0) {
      console.log('✅ Tabela gymPayments já existe!');
      return;
    }

    // Criar tabela gymPayments
    await connection.query(`
      CREATE TABLE gymPayments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gymId INT NOT NULL,
        amountInCents INT NOT NULL,
        status ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled') DEFAULT 'pending' NOT NULL,
        paymentMethod VARCHAR(50) NOT NULL COMMENT 'Método: pix, credit_card, boleto',
        pixTxId VARCHAR(255) UNIQUE COMMENT 'Transaction ID from Efí Pay',
        pixQrCode TEXT COMMENT 'QR Code para pagamento PIX',
        pixQrCodeImage TEXT COMMENT 'Base64 image do QR Code',
        pixCopyPaste TEXT COMMENT 'Código copia e cola do PIX',
        receiptUrl VARCHAR(500) COMMENT 'URL do comprovante no S3',
        description VARCHAR(500) COMMENT 'Ex: Assinatura Professional - Janeiro 2026',
        referenceMonth VARCHAR(7) COMMENT 'Formato: 2026-01 para controlar duplicatas',
        dueDate TIMESTAMP NOT NULL COMMENT 'Data de vencimento',
        paidAt TIMESTAMP NULL COMMENT 'Data de pagamento',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
        INDEX idx_gymId (gymId),
        INDEX idx_status (status),
        INDEX idx_pixTxId (pixTxId),
        INDEX idx_referenceMonth (referenceMonth)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Pagamentos de assinatura SaaS das academias'
    `);

    console.log('✅ Tabela gymPayments criada com sucesso!');
    console.log('\n📝 Estrutura da tabela:');
    console.log('   - Pagamentos separados de alunos (SaaS billing)');
    console.log('   - Suporte a PIX, cartão de crédito e boleto');
    console.log('   - Controle por mês de referência (evita duplicatas)');
    console.log('   - Integração com webhook PIX da Efí Pay');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Endpoint para gerar PIX de assinatura');
    console.log('   2. Webhook detecta pagamento e envia credenciais');
    console.log('   3. Ativação automática do plano');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createGymPaymentsTable().catch(console.error);
