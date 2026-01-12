import mysql from 'mysql2/promise';

async function checkGymsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    const [columns] = await connection.execute('DESCRIBE gyms');
    console.log('Estrutura da tabela gyms:\n');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type}`);
    });

    console.log('\nDados das academias:\n');
    const [gyms] = await connection.execute('SELECT * FROM gyms');
    console.log(gyms);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkGymsTable();
