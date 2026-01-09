import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL for MySQL connection
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

async function createTestBillingCycle() {
  const connection = await pool.getConnection();

  try {
    console.log('🏗️  Criando mensalidade de teste para Academia FitLife...\n');

    // 1. Buscar a academia
    const [gymResult] = await connection.query(
      'SELECT id, name, plan FROM gyms WHERE id = 1'
    );

    if (gymResult.length === 0) {
      console.error('❌ Academia não encontrada');
      return;
    }

    const gym = gymResult[0];
    console.log(`✅ Academia encontrada: ${gym.name} (Plano: ${gym.plan})`);

    // 2. Buscar o preço do plano enterprise
    const [planResult] = await connection.query(
      "SELECT priceInCents FROM saasPlans WHERE slug = 'enterprise'"
    );

    if (planResult.length === 0) {
      console.error('❌ Plano enterprise não encontrado');
      return;
    }

    const planPrice = planResult[0].priceInCents;
    console.log(`✅ Preço do plano: R$ ${(planPrice / 100).toFixed(2)}`);

    // 3. Buscar configurações de billing
    const [settingsResult] = await connection.query(
      'SELECT billingDueDay FROM superAdminSettings LIMIT 1'
    );

    const dueDay = settingsResult[0]?.billingDueDay || 15;
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
    const [existingResult] = await connection.query(
      'SELECT id FROM gym_billing_cycles WHERE gymId = ? AND referenceMonth = ?',
      [gym.id, referenceMonth]
    );

    if (existingResult.length > 0) {
      console.log('\n⚠️  Já existe uma mensalidade para este mês. Deletando...');
      await connection.query(
        'DELETE FROM gym_billing_cycles WHERE gymId = ? AND referenceMonth = ?',
        [gym.id, referenceMonth]
      );
    }

    // 6. Criar a mensalidade
    const [insertResult] = await connection.query(
      `INSERT INTO gym_billing_cycles
        (gymId, referenceMonth, dueDate, amountCents, status, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [gym.id, referenceMonth, dueDate, planPrice, 'pending']
    );

    const billingId = insertResult.insertId;

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
    connection.release();
    await pool.end();
  }
}

createTestBillingCycle();
