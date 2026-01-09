import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'academia_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkPlans() {
  const connection = await pool.getConnection();

  try {
    console.log('📋 Planos SaaS Cadastrados:\n');

    const [plans] = await connection.query(
      'SELECT id, slug, name, priceInCents, active FROM saasPlans ORDER BY displayOrder'
    );

    plans.forEach(plan => {
      console.log(`${plan.id}. ${plan.name} (${plan.slug})`);
      console.log(`   Preço: R$ ${(plan.priceInCents / 100).toFixed(2)}`);
      console.log(`   Status: ${plan.active ? 'Ativo' : 'Inativo'}`);
      console.log('');
    });

    console.log('📊 Academia FitLife:\n');
    const [gyms] = await connection.query('SELECT id, name, plan FROM gyms WHERE id = 1');

    if (gyms.length > 0) {
      const gym = gyms[0];
      console.log(`   Nome: ${gym.name}`);
      console.log(`   Plano: ${gym.plan}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

checkPlans();
