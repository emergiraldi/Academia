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

async function deleteBilling() {
  const connection = await pool.getConnection();

  try {
    console.log('🗑️  Deletando mensalidades...\n');

    const [result] = await connection.query('DELETE FROM gym_billing_cycles WHERE gym_id = 1');

    console.log(`✅ ${result.affectedRows} mensalidade(s) deletada(s)`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

deleteBilling();
