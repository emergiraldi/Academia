/**
 * Cria tabela gym_billing_cycles para mensalidades recorrentes das academias
 */
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function createTable() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
  const url = new URL(dbUrl);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1)
  });

  console.log('📊 Criando tabela gym_billing_cycles...');

  // Criar tabela
  await connection.query(`
    CREATE TABLE IF NOT EXISTS gym_billing_cycles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      gym_id INT NOT NULL,
      reference_month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
      due_date DATE NOT NULL,
      amount_cents INT NOT NULL,
      status ENUM('pending', 'paid', 'overdue', 'canceled') DEFAULT 'pending',
      payment_id INT NULL COMMENT 'FK para gymPayments quando gerar PIX',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME NULL,
      notified_at DATETIME NULL COMMENT 'Quando enviou notificação',
      blocked_at DATETIME NULL COMMENT 'Quando bloqueou por falta de pagamento',
      notes TEXT NULL,

      UNIQUE KEY unique_gym_month (gym_id, reference_month),
      INDEX idx_gym_id (gym_id),
      INDEX idx_payment_id (payment_id),
      INDEX idx_status (status),
      INDEX idx_due_date (due_date),
      INDEX idx_reference_month (reference_month)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ Tabela gym_billing_cycles criada com sucesso!');

  await connection.end();
}

createTable().catch(error => {
  console.error('❌ Erro ao criar tabela:', error);
  process.exit(1);
});
