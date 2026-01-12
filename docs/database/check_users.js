import mysql from 'mysql2/promise';

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('=== Usuários para Login ===\n');

    const [users] = await connection.execute(`
      SELECT id, name, email, role
      FROM users
      WHERE role IN ('professor', 'gym_admin')
      ORDER BY role, name
    `);

    users.forEach(user => {
      console.log(`📋 ${user.role.toUpperCase()}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Senha padrão: senha123 (ou tente: admin123, 123456)`);
      console.log('');
    });

    if (users.length === 0) {
      console.log('❌ Nenhum professor ou admin encontrado!');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsers();
