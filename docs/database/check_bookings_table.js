import mysql from 'mysql2/promise';

async function checkBookingsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('=== Estrutura da tabela class_bookings ===\n');

    const [columns] = await connection.execute('DESCRIBE class_bookings');
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(5)} | ${col.Key.padEnd(5)} | ${col.Default}`);
    });

    console.log('\n=== Primeiras 5 linhas da tabela ===\n');
    const [rows] = await connection.execute('SELECT * FROM class_bookings LIMIT 5');
    console.log(rows);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkBookingsTable();
