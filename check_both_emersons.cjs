const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEmersons() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  console.log('=== TODOS OS USUÁRIOS EMERSON ===\n');
  const [users] = await conn.execute(`
    SELECT id, name, email, role
    FROM users
    WHERE name LIKE '%Emerson%'
  `);

  for (const user of users) {
    console.log(`User ID: ${user.id}`);
    console.log(`Nome: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);

    const [students] = await conn.execute(`
      SELECT id, membershipStatus
      FROM students
      WHERE userId = ?
    `, [user.id]);

    if (students.length > 0) {
      console.log(`✅ TEM Student (ID: ${students[0].id}, Status: ${students[0].membershipStatus})`);
    } else {
      console.log(`❌ NÃO tem Student`);
    }
    console.log('');
  }

  await conn.end();
}

checkEmersons();
