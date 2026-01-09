import mysql from 'mysql2/promise';

// Conectar diretamente ao banco da VPS
const pool = mysql.createPool({
  host: '72.60.2.237',
  port: 3306,
  user: 'root',
  password: '935559Emerson@',
  database: 'academia_db',
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

    // 2. Usar valor fixo para teste: R$ 1,00
    const planPrice = 100; // R$ 1,00 em centavos
    console.log(`✅ Valor da mensalidade (teste): R$ ${(planPrice / 100).toFixed(2)}`);

    // 3. Usar dia de vencimento padrão (dia 15)
    const dueDay = 15;
    console.log(`✅ Dia de vencimento: dia ${dueDay}`);

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
      'SELECT id FROM gym_billing_cycles WHERE gym_id = ? AND reference_month = ?',
      [gym.id, referenceMonth]
    );

    if (existingResult.length > 0) {
      console.log('\n⚠️  Já existe uma mensalidade para este mês. Deletando...');
      await connection.query(
        'DELETE FROM gym_billing_cycles WHERE gym_id = ? AND reference_month = ?',
        [gym.id, referenceMonth]
      );
    }

    // 6. Criar a mensalidade
    const [insertResult] = await connection.query(
      `INSERT INTO gym_billing_cycles
        (gym_id, reference_month, due_date, amount_cents, status, created_at)
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
