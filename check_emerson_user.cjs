const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  console.log('=== USUÁRIO EMERSON ===');
  const [users] = await connection.execute(`
    SELECT id, email, name, role
    FROM users
    WHERE email = 'emerson.student@giralditelecom.com.br'
  `);
  console.table(users);

  if (users.length > 0) {
    const userId = users[0].id;
    console.log('\n=== ALUNO VINCULADO ===');
    const [students] = await connection.execute(`
      SELECT id, userId, registrationNumber, photoUrl,
             CASE
               WHEN photoUrl IS NULL THEN 'NULL'
               WHEN LENGTH(photoUrl) < 100 THEN photoUrl
               ELSE CONCAT(LEFT(photoUrl, 50), '... [', LENGTH(photoUrl), ' caracteres]')
             END as photoUrlPreview
      FROM students
      WHERE userId = ?
    `, [userId]);
    console.table(students);
  }

  await connection.end();
})().catch(console.error);
