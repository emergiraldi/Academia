const mysql = require('mysql2/promise');

async function checkGymData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Verificando dados da academia...\n');

    const [gyms] = await connection.execute(
      'SELECT * FROM gyms LIMIT 1'
    );

    if (gyms.length === 0) {
      console.log('❌ Nenhuma academia encontrada!\n');
      return;
    }

    const gym = gyms[0];
    console.log('=== DADOS DA ACADEMIA ===\n');

    Object.entries(gym).forEach(([key, value]) => {
      const displayValue = value === null ? 'NULL' :
                          value === '' ? '(string vazia)' :
                          value;
      console.log(`${key}: ${displayValue}`);
    });

    console.log('\n=== CAMPOS IMPORTANTES ===');
    console.log(`plan: ${gym.plan === null ? 'NULL' : gym.plan}`);
    console.log(`planStatus: ${gym.planStatus === null ? 'NULL' : gym.planStatus}`);
    console.log(`status: ${gym.status === null ? 'NULL' : gym.status}`);
    console.log(`email: ${gym.email === null ? 'NULL' : gym.email}`);
    console.log(`name: ${gym.name === null ? 'NULL' : gym.name}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkGymData();
