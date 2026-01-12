import mysql from 'mysql2/promise';

async function cleanupAdmins() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('🔍 Verificando admins e alunos...\n');

    // Get all admins
    const [admins] = await connection.execute(
      'SELECT id, name, email FROM users WHERE role = "gym_admin"'
    );

    console.log('📋 Administradores encontrados:');
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
    console.log('');

    // Check which admins have students in their gym
    const [students] = await connection.execute(
      'SELECT s.id, u.name, s.gymId FROM students s JOIN users u ON s.userId = u.id'
    );

    console.log('👥 Alunos cadastrados:');
    students.forEach(student => {
      console.log(`   - ${student.name} (Gym ID: ${student.gymId})`);
    });
    console.log('');

    // Get gyms with students
    const [gyms] = await connection.execute(`
      SELECT DISTINCT g.id, g.name, g.ownerId
      FROM gyms g
      JOIN students s ON s.gymId = g.id
    `);

    if (gyms.length === 0) {
      console.log('⚠️  Nenhuma academia tem alunos cadastrados!');
      console.log('❌ Cancelando operação para evitar excluir todos os admins.');
      return;
    }

    console.log('🏋️  Academias com alunos:');
    const ownerIds = [];
    for (const gym of gyms) {
      console.log(`   - ${gym.name} (Owner ID: ${gym.ownerId})`);
      ownerIds.push(gym.ownerId);
    }
    console.log('');

    // Get admins to keep (gym owners with students)
    const [adminsToKeep] = await connection.execute(
      `SELECT u.id, u.name, u.email
       FROM users u
       WHERE u.role = "gym_admin"
       AND u.id IN (${ownerIds.join(',')})`,
    );

    console.log('✅ Administradores que serão mantidos:');
    adminsToKeep.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
    console.log('');

    // Get admins to delete
    const keepIds = adminsToKeep.map(a => a.id);
    const [adminsToDelete] = await connection.execute(
      `SELECT id, name, email
       FROM users
       WHERE role = "gym_admin"
       AND id NOT IN (${keepIds.length > 0 ? keepIds.join(',') : '0'})`,
    );

    if (adminsToDelete.length === 0) {
      console.log('✅ Nenhum admin para excluir!');
      return;
    }

    console.log('🗑️  Administradores que serão excluídos:');
    adminsToDelete.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
    console.log('');

    // Delete admins
    const deleteIds = adminsToDelete.map(a => a.id);
    await connection.execute(
      `DELETE FROM users WHERE id IN (${deleteIds.join(',')})`
    );

    console.log('✅ Administradores excluídos com sucesso!\n');
    console.log('📊 Resumo Final:');
    console.log(`   Admins mantidos: ${adminsToKeep.length}`);
    console.log(`   Admins excluídos: ${adminsToDelete.length}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

cleanupAdmins();
