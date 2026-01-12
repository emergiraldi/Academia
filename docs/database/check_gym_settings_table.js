import mysql from 'mysql2/promise';

async function checkTable() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('=== gym_settings table structure ===\n');
    const [columns] = await conn.execute('DESCRIBE gym_settings');
    columns.forEach(col => {
      console.log(`${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
}

checkTable();
