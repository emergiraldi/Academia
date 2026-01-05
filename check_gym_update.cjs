const mysql = require('mysql2/promise');

async function checkGymUpdate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Verificando academias cadastradas...\n');

    const [gyms] = await connection.execute(
      'SELECT id, name, slug, plan, plan_status, status FROM gyms ORDER BY id DESC LIMIT 5'
    );

    if (gyms.length === 0) {
      console.log('❌ Nenhuma academia encontrada!\n');
    } else {
      console.log('✅ Academias encontradas:\n');
      console.log('═══════════════════════════════════════════');
      gyms.forEach(gym => {
        console.log(`ID: ${gym.id}`);
        console.log(`Nome: ${gym.name}`);
        console.log(`Slug: ${gym.slug}`);
        console.log(`Plano: ${gym.plan || 'Não definido'}`);
        console.log(`Status do Plano: ${gym.plan_status || 'Não definido'}`);
        console.log(`Status Geral: ${gym.status || 'Não definido'}`);
        console.log('---');
      });
      console.log('═══════════════════════════════════════════\n');

      // Verificar usuários admin dessas academias
      console.log('Verificando usuários admin...\n');
      for (const gym of gyms) {
        const [admins] = await connection.execute(
          'SELECT id, email, name, role FROM users WHERE gymId = ? AND role = ?',
          [gym.id, 'gym_admin']
        );

        console.log(`Academia "${gym.name}" (ID: ${gym.id}):`);
        if (admins.length > 0) {
          admins.forEach(admin => {
            console.log(`  ✓ Admin: ${admin.name} (${admin.email})`);
          });
        } else {
          console.log(`  ❌ Nenhum admin cadastrado!`);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkGymUpdate();
