/**
 * Processa pagamento de academia manualmente
 * Execute: node process_gym_payment_manual.js <gymId>
 */
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function processPayment(gymId) {
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
    // Buscar academia
    console.log(`\n🔍 Buscando academia ID ${gymId}...`);
    const [gyms] = await connection.query(`
      SELECT * FROM gyms WHERE id = ?
    `, [gymId]);

    if (gyms.length === 0) {
      console.log('❌ Academia não encontrada!');
      return;
    }

    const gym = gyms[0];
    console.log(`✅ Academia encontrada: ${gym.name}`);
    console.log(`   Status atual: ${gym.status} | PlanStatus: ${gym.planStatus}`);
    console.log(`   Email: ${gym.tempAdminEmail || 'N/A'}`);

    // Buscar pagamento pendente
    console.log(`\n🔍 Buscando pagamento pendente...`);
    const [payments] = await connection.query(`
      SELECT * FROM gymPayments WHERE gymId = ? AND status = 'pending' ORDER BY createdAt DESC LIMIT 1
    `, [gymId]);

    if (payments.length === 0) {
      console.log('❌ Nenhum pagamento pendente encontrado!');
      return;
    }

    const payment = payments[0];
    console.log(`✅ Pagamento encontrado: ID ${payment.id}`);
    console.log(`   TxID: ${payment.pixTxId}`);
    console.log(`   Valor: R$ ${(payment.amountInCents / 100).toFixed(2)}`);

    // Atualizar pagamento para paid
    console.log(`\n💳 Atualizando pagamento para "paid"...`);
    await connection.query(`
      UPDATE gymPayments
      SET status = 'paid', paidAt = NOW()
      WHERE id = ?
    `, [payment.id]);
    console.log(`✅ Pagamento atualizado!`);

    // Ativar academia
    console.log(`\n🏢 Ativando academia...`);
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    nextBilling.setDate(10);

    await connection.query(`
      UPDATE gyms
      SET
        status = 'active',
        planStatus = 'active',
        blockedReason = NULL,
        subscriptionStartsAt = NOW(),
        nextBillingDate = ?,
        tempAdminPassword = NULL,
        tempAdminEmail = NULL
      WHERE id = ?
    `, [nextBilling, gymId]);
    console.log(`✅ Academia ativada!`);

    // Informar sobre envio de emails
    console.log(`\n📧 IMPORTANTE: Enviar emails manualmente:`);
    console.log(`   1. Email para: ${gym.tempAdminEmail}`);
    console.log(`   2. Senha temporária: ${gym.tempAdminPassword}`);
    console.log(`   3. Link de acesso: https://www.sysfitpro.com.br/admin/login?gym=${gym.slug}`);

    console.log(`\n✅ SUCESSO! Academia ${gym.name} foi ativada!`);
    console.log(`\n📊 Status final:`);
    const [updatedGyms] = await connection.query(`SELECT status, planStatus FROM gyms WHERE id = ?`, [gymId]);
    console.log(`   Status: ${updatedGyms[0].status}`);
    console.log(`   PlanStatus: ${updatedGyms[0].planStatus}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

const gymId = process.argv[2] || 29; // Default para academia teste
console.log(`\n========================================`);
console.log(`  PROCESSAMENTO MANUAL DE PAGAMENTO`);
console.log(`========================================`);
processPayment(gymId).catch(console.error);
