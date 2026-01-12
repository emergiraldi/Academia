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

// Preços dos planos em centavos
const PLAN_PRICES = {
  starter: 19900,   // R$ 199,00
  basic: 49900,     // R$ 499,00
  enterprise: 59900 // R$ 599,00
};

async function setupBillingTest() {
  const connection = await pool.getConnection();

  try {
    console.log('🧪 CONFIGURANDO TESTE DE MENSALIDADES\n');
    console.log('========================================');

    // 1. Buscar a academia
    const [gymResult] = await connection.query(
      'SELECT id, name, plan FROM gyms WHERE id = 1'
    );

    if (gymResult.length === 0) {
      console.error('❌ Academia não encontrada');
      return;
    }

    const gym = gymResult[0];
    const planPrice = PLAN_PRICES[gym.plan] || 59900;

    console.log(`✅ Academia: ${gym.name}`);
    console.log(`✅ Plano: ${gym.plan}`);
    console.log(`✅ Valor: R$ ${(planPrice / 100).toFixed(2)}`);
    console.log('');

    // 2. Deletar mensalidades existentes
    console.log('🗑️  Deletando mensalidades de teste anteriores...');
    await connection.query('DELETE FROM gym_billing_cycles WHERE gym_id = ?', [gym.id]);
    console.log('✅ Mensalidades deletadas');
    console.log('');

    // 3. Criar mensalidade ATUAL (vence daqui a 1 minuto para teste)
    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60000); // +1 minuto
    const currentMonth = `${nextMinute.getFullYear()}-${String(nextMinute.getMonth() + 1).padStart(2, '0')}`;

    console.log('📅 Criando mensalidade ATUAL...');
    await connection.query(
      `INSERT INTO gym_billing_cycles
        (gym_id, reference_month, due_date, amount_cents, status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [gym.id, currentMonth, nextMinute, planPrice, 'pending']
    );
    console.log(`✅ Mensalidade atual criada`);
    console.log(`   Vencimento: ${nextMinute.toLocaleString('pt-BR')}`);
    console.log(`   Status: pending`);
    console.log('');

    // 4. Criar mensalidade VENCIDA (venceu ontem)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastMonth = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}`;

    console.log('📅 Criando mensalidade VENCIDA...');
    await connection.query(
      `INSERT INTO gym_billing_cycles
        (gym_id, reference_month, due_date, amount_cents, status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [gym.id, lastMonth, yesterday, planPrice, 'pending']
    );
    console.log(`✅ Mensalidade vencida criada`);
    console.log(`   Vencimento: ${yesterday.toLocaleString('pt-BR')}`);
    console.log(`   Status: pending (deve mudar para overdue pelo cron)`);
    console.log('');

    console.log('========================================');
    console.log('✅ TESTE CONFIGURADO COM SUCESSO!');
    console.log('========================================');
    console.log('');
    console.log('📋 O QUE TESTAR:');
    console.log('');
    console.log('1️⃣  Aguarde 1 minuto para verificar se o cron atualiza o status');
    console.log('    da mensalidade vencida para "overdue"');
    console.log('');
    console.log('2️⃣  Acesse: https://www.sysfitpro.com.br/admin/billing');
    console.log('    e verifique se as 2 mensalidades aparecem');
    console.log('');
    console.log('3️⃣  A mensalidade vencida deve aparecer com badge vermelho');
    console.log('    "Vencido" e o status da academia deve ser "blocked"');
    console.log('');
    console.log('4️⃣  Gere o PIX para uma das mensalidades e teste o pagamento');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao configurar teste:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

setupBillingTest();
