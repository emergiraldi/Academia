/**
 * Verifica últimas academias e pagamentos
 */
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkPayments() {
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
    console.log('📊 Últimas academias criadas:\n');
    const [gyms] = await connection.query(`
      SELECT id, name, slug, status, planStatus, tempAdminEmail, createdAt
      FROM gyms
      ORDER BY createdAt DESC
      LIMIT 5
    `);

    gyms.forEach(g => {
      console.log(`ID: ${g.id} | Nome: ${g.name} | Status: ${g.status} | PlanStatus: ${g.planStatus}`);
      console.log(`  Email: ${g.tempAdminEmail || 'N/A'} | Criada: ${g.createdAt}\n`);
    });

    console.log('💳 Últimos pagamentos de academias:\n');
    const [payments] = await connection.query(`
      SELECT id, gymId, status, amountInCents, pixTxId, paidAt, createdAt
      FROM gym_payments
      ORDER BY createdAt DESC
      LIMIT 5
    `);

    payments.forEach(p => {
      console.log(`ID: ${p.id} | GymID: ${p.gymId} | Status: ${p.status} | Valor: R$ ${(p.amountInCents/100).toFixed(2)}`);
      console.log(`  TxID: ${p.pixTxId || 'N/A'} | Pago em: ${p.paidAt || 'Pendente'}\n`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

checkPayments().catch(console.error);
