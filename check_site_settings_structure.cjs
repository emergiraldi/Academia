const mysql = require('mysql2/promise');

async function checkStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Verificando estrutura da tabela site_settings...\n');

    const [columns] = await connection.execute(
      'DESCRIBE site_settings'
    );

    console.log('Colunas encontradas:\n');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('\n\nDados na tabela:\n');
    const [rows] = await connection.execute('SELECT * FROM site_settings');
    console.log(JSON.stringify(rows, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkStructure();
