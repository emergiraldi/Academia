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

async function setupBillingTestToday() {
  const connection = await pool.getConnection();

  try {
    console.log('🧪 CONFIGURANDO TESTE DE MENSALIDADES PARA HOJE\n');
    console.log('========================================\n');

    const now = new Date();
    const today = now.getDate();

    // 1. Atualizar billingDueDay para hoje
    console.log(`📅 Configurando billingDueDay para ${today}...\n`);

    await connection.query(
      'UPDATE superAdminSettings SET billingDueDay = ?, billingEnabled = ? WHERE id = 1',
      [today, 'Y']
    );

    console.log('✅ Configuração atualizada!');
    console.log(`   billingDueDay: ${today}`);
    console.log('   billingEnabled: Y');
    console.log('');

    // 2. Deletar mensalidades existentes
    console.log('🗑️  Deletando mensalidades existentes...\n');

    await connection.query('DELETE FROM gym_billing_cycles WHERE gym_id = 1');

    console.log('✅ Mensalidades deletadas');
    console.log('');

    // 3. Buscar preço do plano Enterprise
    const [plans] = await connection.query(
      'SELECT priceInCents FROM saasPlans WHERE slug = ? AND active = ?',
      ['enterprise', 1]
    );

    if (plans.length === 0) {
      console.error('❌ Plano Enterprise não encontrado');
      return;
    }

    const priceInCents = plans[0].priceInCents;
    console.log(`💰 Preço do plano Enterprise: R$ ${(priceInCents / 100).toFixed(2)}\n`);

    // 4. Criar uma mensalidade VENCIDA (ontem) para testar o cron de overdue
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastMonth = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}`;

    console.log('📅 Criando mensalidade VENCIDA (ontem) para testar status overdue...\n');

    await connection.query(
      `INSERT INTO gym_billing_cycles
        (gym_id, reference_month, due_date, amount_cents, status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [1, lastMonth, yesterday, priceInCents, 'pending']
    );

    console.log('✅ Mensalidade vencida criada:');
    console.log(`   Vencimento: ${yesterday.toLocaleString('pt-BR')}`);
    console.log(`   Status: pending (deve mudar para overdue pelo cron)`);
    console.log('');

    console.log('========================================');
    console.log('✅ TESTE CONFIGURADO COM SUCESSO!');
    console.log('========================================');
    console.log('');
    console.log('📋 O QUE VAI ACONTECER:');
    console.log('');
    console.log(`1️⃣  O cron de mensalidades (rodando a cada 1 minuto) vai criar`);
    console.log(`    automaticamente uma nova mensalidade com vencimento de HOJE (dia ${today})`);
    console.log('');
    console.log('2️⃣  O cron de overdue vai mudar o status da mensalidade de ontem');
    console.log('    para "overdue" e bloquear a academia');
    console.log('');
    console.log('3️⃣  Aguarde 1-2 minutos e acesse:');
    console.log('    https://www.sysfitpro.com.br/admin/billing');
    console.log('');
    console.log('4️⃣  Você deve ver 2 mensalidades:');
    console.log(`    - Uma de hoje (dia ${today}) com status "pending"`);
    console.log('    - Uma de ontem com status "overdue" (vermelho)');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao configurar teste:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

setupBillingTestToday();
