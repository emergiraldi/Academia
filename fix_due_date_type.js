import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = new URL(process.env.DATABASE_URL);
const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.substring(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function fixDueDateType() {
  const connection = await pool.getConnection();

  try {
    console.log('🔧 Alterando tipo da coluna due_date de DATE para DATETIME...\n');

    // Alterar o tipo da coluna
    await connection.query(
      'ALTER TABLE gym_billing_cycles MODIFY COLUMN due_date DATETIME NOT NULL'
    );

    console.log('✅ Coluna alterada com sucesso!');
    console.log('');

    // Verificar a mudança
    const [result] = await connection.query(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'gym_billing_cycles' AND COLUMN_NAME = 'due_date'"
    );

    console.log('Novo tipo:', result[0].COLUMN_TYPE);
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao alterar coluna:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

fixDueDateType();
