const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  console.log('=== ESTRUTURA DA TABELA bank_accounts ===');
  const [columns] = await connection.execute('DESCRIBE bank_accounts');
  console.table(columns);

  console.log('\n=== DADOS DA TABELA bank_accounts ===');
  const [rows] = await connection.execute('SELECT * FROM bank_accounts');
  console.table(rows);

  await connection.end();
})().catch(console.error);
