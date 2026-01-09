import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestBillingCycle() {
  const client = await pool.connect();

  try {
    console.log('🏗️  Criando mensalidade de teste para Academia FitLife...\n');

    // 1. Buscar a academia
    const gymResult = await client.query(
      'SELECT id, name, plan FROM gyms WHERE id = 1'
    );

    if (gymResult.rows.length === 0) {
      console.error('❌ Academia não encontrada');
      return;
    }

    const gym = gymResult.rows[0];
    console.log(`✅ Academia encontrada: ${gym.name} (Plano: ${gym.plan})`);

    // 2. Buscar o preço do plano enterprise
    const planResult = await client.query(
      "SELECT priceMonthly FROM saasPlans WHERE id = 'enterprise'"
    );

    if (planResult.rows.length === 0) {
      console.error('❌ Plano enterprise não encontrado');
      return;
    }

    const planPrice = planResult.rows[0].pricemonthly;
    console.log(`✅ Preço do plano: R$ ${(planPrice / 100).toFixed(2)}`);

    // 3. Buscar configurações de billing
    const settingsResult = await client.query(
      'SELECT billingDueDay FROM superAdminSettings LIMIT 1'
    );

    const dueDay = settingsResult.rows[0]?.billingdueday || 15;
    console.log(`✅ Dia de vencimento configurado: dia ${dueDay}`);

    // 4. Calcular data de vencimento (dia 15 do mês atual)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    const dueDate = new Date(currentYear, currentMonth, dueDay);

    // Se a data já passou, usar mês seguinte
    if (dueDate < now) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const referenceMonth = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;

    console.log(`✅ Mês de referência: ${referenceMonth}`);
    console.log(`✅ Data de vencimento: ${dueDate.toLocaleDateString('pt-BR')}`);

    // 5. Verificar se já existe uma mensalidade para este mês
    const existingResult = await client.query(
      'SELECT id FROM gym_billing_cycles WHERE gymId = $1 AND referenceMonth = $2',
      [gym.id, referenceMonth]
    );

    if (existingResult.rows.length > 0) {
      console.log('\n⚠️  Já existe uma mensalidade para este mês. Deletando...');
      await client.query(
        'DELETE FROM gym_billing_cycles WHERE gymId = $1 AND referenceMonth = $2',
        [gym.id, referenceMonth]
      );
    }

    // 6. Criar a mensalidade
    const insertResult = await client.query(
      `INSERT INTO gym_billing_cycles
        (gymId, referenceMonth, dueDate, amountCents, status, createdAt)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [gym.id, referenceMonth, dueDate, planPrice, 'pending']
    );

    const billingId = insertResult.rows[0].id;

    console.log('\n========================================');
    console.log('✅ Mensalidade de teste criada com sucesso!');
    console.log('========================================');
    console.log(`ID: ${billingId}`);
    console.log(`Academia: ${gym.name}`);
    console.log(`Plano: ${gym.plan}`);
    console.log(`Valor: R$ ${(planPrice / 100).toFixed(2)}`);
    console.log(`Vencimento: ${dueDate.toLocaleDateString('pt-BR')}`);
    console.log(`Status: Pendente`);
    console.log('========================================\n');
    console.log('🌐 Acesse: https://www.sysfitpro.com.br/admin/billing');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao criar mensalidade:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestBillingCycle();
