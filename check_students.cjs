const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStudents() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const [students] = await conn.execute(`
    SELECT s.id, u.name, u.email, s.membershipStatus
    FROM students s
    JOIN users u ON s.userId = u.id
    LIMIT 5
  `);

  console.log('Alunos com registro completo:');
  students.forEach(s => {
    console.log(`- ${s.name}`);
    console.log(`  Email: ${s.email}`);
    console.log(`  Status: ${s.membershipStatus}`);
    console.log('');
  });

  await conn.end();
}

checkStudents();
