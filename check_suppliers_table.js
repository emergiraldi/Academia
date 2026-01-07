import mysql from 'mysql2/promise';

async function checkTable() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    // Show table structure
    const [columns] = await conn.execute('DESCRIBE suppliers');
    console.log('\n=== Suppliers Table Structure ===');
    console.log(columns);

    // Also try SHOW CREATE TABLE
    const [createTable] = await conn.execute('SHOW CREATE TABLE suppliers');
    console.log('\n=== CREATE TABLE Statement ===');
    console.log(createTable[0]['Create Table']);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
}

checkTable();
