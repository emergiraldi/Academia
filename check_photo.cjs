const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  console.log('=== VERIFICANDO FOTO DO EMERSON ===');
  const [students] = await connection.execute(`
    SELECT id, userId, photoUrl,
           CASE
             WHEN photoUrl IS NULL THEN 'NULL'
             WHEN LENGTH(photoUrl) < 100 THEN photoUrl
             ELSE CONCAT(LEFT(photoUrl, 50), '... [', LENGTH(photoUrl), ' caracteres]')
           END as photoUrlPreview
    FROM students
    WHERE userId = 3
  `);
  console.table(students);

  await connection.end();
})().catch(console.error);
