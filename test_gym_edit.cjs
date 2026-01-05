const mysql = require('mysql2/promise');

async function testGymEdit() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Buscando academia para teste...\n');

    const [gyms] = await connection.execute(
      'SELECT id, name, slug, plan, planStatus, status FROM gyms LIMIT 1'
    );

    if (gyms.length === 0) {
      console.log('❌ Nenhuma academia encontrada!\n');
      return;
    }

    const gym = gyms[0];
    console.log('Academia encontrada:');
    console.log(`  ID: ${gym.id}`);
    console.log(`  Nome: ${gym.name}`);
    console.log(`  Slug: ${gym.slug}`);
    console.log(`  Plano: ${gym.plan}`);
    console.log(`  Status do Plano: ${gym.planStatus}`);
    console.log(`  Status: ${gym.status}\n`);

    // Testar update do plano
    console.log('Testando UPDATE do plano para "professional"...\n');

    await connection.execute(
      'UPDATE gyms SET plan = ?, planStatus = ? WHERE id = ?',
      ['professional', 'active', gym.id]
    );

    // Verificar resultado
    const [updated] = await connection.execute(
      'SELECT plan, planStatus, status FROM gyms WHERE id = ?',
      [gym.id]
    );

    console.log('Após UPDATE:');
    console.log(`  Plano: ${updated[0].plan}`);
    console.log(`  Status do Plano: ${updated[0].planStatus}`);
    console.log(`  Status: ${updated[0].status}\n`);

    // Reverter
    await connection.execute(
      'UPDATE gyms SET plan = ?, planStatus = ? WHERE id = ?',
      [gym.plan, gym.planStatus, gym.id]
    );

    console.log('✅ Teste concluído! UPDATE funciona no MySQL.\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

testGymEdit();
