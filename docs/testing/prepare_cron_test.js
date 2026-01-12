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

async function prepareCronTest() {
  const connection = await pool.getConnection();

  try {
    console.log('🔍 VERIFICANDO ESTADO ATUAL NO VPS\n');
    console.log('========================================\n');

    // 1. Verificar planos cadastrados
    console.log('📋 Planos SaaS cadastrados:\n');
    const [plans] = await connection.query(
      'SELECT id, slug, name, priceInCents, active FROM saasPlans ORDER BY displayOrder'
    );

    plans.forEach(plan => {
      console.log(`   ${plan.slug}: ${plan.name}`);
      console.log(`   Preço: R$ ${(plan.priceInCents / 100).toFixed(2)}`);
      console.log(`   Status: ${plan.active ? 'Ativo' : 'Inativo'}`);
      console.log('');
    });

    // 2. Verificar academia FitLife
    console.log('🏋️  Academia FitLife:\n');
    const [gyms] = await connection.query(
      'SELECT id, name, plan, status FROM gyms WHERE id = 1'
    );

    if (gyms.length === 0) {
      console.error('❌ Academia não encontrada');
      return;
    }

    const gym = gyms[0];
    console.log(`   Nome: ${gym.name}`);
    console.log(`   Plano: ${gym.plan}`);
    console.log(`   Status: ${gym.status}`);
    console.log('');

    // 3. Encontrar o preço do plano da academia
    const gymPlan = plans.find(p => p.slug === gym.plan);
    if (gymPlan) {
      console.log(`   Preço do plano: R$ ${(gymPlan.priceInCents / 100).toFixed(2)}`);
      console.log('');
    }

    // 4. Verificar mensalidades existentes
    console.log('📅 Mensalidades existentes:\n');
    const [billings] = await connection.query(
      'SELECT id, reference_month, due_date, amount_cents, status FROM gym_billing_cycles WHERE gym_id = ? ORDER BY due_date DESC',
      [gym.id]
    );

    if (billings.length === 0) {
      console.log('   Nenhuma mensalidade cadastrada\n');
    } else {
      billings.forEach(billing => {
        console.log(`   ID: ${billing.id}`);
        console.log(`   Mês: ${billing.reference_month}`);
        console.log(`   Vencimento: ${new Date(billing.due_date).toLocaleString('pt-BR')}`);
        console.log(`   Valor: R$ ${(billing.amount_cents / 100).toFixed(2)}`);
        console.log(`   Status: ${billing.status}`);
        console.log('');
      });
    }

    // 5. Deletar mensalidades existentes
    console.log('========================================');
    console.log('🗑️  Deletando mensalidades existentes...\n');

    const [deleteResult] = await connection.query(
      'DELETE FROM gym_billing_cycles WHERE gym_id = ?',
      [gym.id]
    );

    console.log(`✅ ${deleteResult.affectedRows} mensalidade(s) deletada(s)\n`);

    console.log('========================================');
    console.log('✅ PREPARAÇÃO CONCLUÍDA!\n');
    console.log('Próximo passo: Modificar o cron para rodar a cada 1 minuto');
    console.log('e fazer o deploy para testar.\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

prepareCronTest();
