const mysql = require('mysql2/promise');

async function verificarTabela() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('📊 Estrutura da tabela subscriptions:\n');

    const [columns] = await conn.execute(
      `DESCRIBE subscriptions`
    );

    columns.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n📋 Dados da subscription do Emerson:\n');

    const [data] = await conn.execute(
      `SELECT * FROM subscriptions WHERE studentId = 2 LIMIT 1`
    );

    if (data.length > 0) {
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('   Nenhuma subscription encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

verificarTabela();
