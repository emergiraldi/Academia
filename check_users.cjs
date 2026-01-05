const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  console.log('=== USUÁRIOS ALUNOS ===');
  const [users] = await connection.execute(`
    SELECT u.id, u.email, u.name, u.role, s.id as studentId, s.registrationNumber
    FROM users u
    LEFT JOIN students s ON s.userId = u.id
    WHERE u.role = 'student'
    LIMIT 10
  `);
  console.table(users);

  console.log('\n=== USUÁRIOS ADMIN ===');
  const [admins] = await connection.execute(`
    SELECT id, email, name, role
    FROM users
    WHERE role = 'admin'
    LIMIT 5
  `);
  console.table(admins);

  await connection.end();
})().catch(console.error);
