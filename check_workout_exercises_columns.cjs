const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumns() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [cols] = await conn.execute('DESCRIBE workout_exercises');
  console.log('Colunas da tabela workout_exercises:');
  cols.forEach(c => console.log(`  - ${c.Field}`));
  await conn.end();
}

checkColumns();
