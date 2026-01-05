const mysql = require('mysql2/promise');

async function testDirectUpdate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('🔄 Tentando atualizar academia diretamente no MySQL...\n');

    // Buscar dados atuais
    console.log('📋 Dados ANTES da atualização:');
    const [before] = await connection.execute(
      'SELECT id, name, zipCode, city, state, plan, planStatus FROM gyms WHERE id = 1'
    );
    console.log(before[0]);

    // Fazer update
    console.log('\n🔨 Executando UPDATE...');
    const [result] = await connection.execute(
      'UPDATE gyms SET zipCode = ?, city = ?, state = ? WHERE id = ?',
      ['01234-999', 'São Paulo', 'SP', 1]
    );

    console.log('Linhas afetadas:', result.affectedRows);
    console.log('Changed rows:', result.changedRows);

    // Buscar dados após update
    console.log('\n📋 Dados DEPOIS da atualização:');
    const [after] = await connection.execute(
      'SELECT id, name, zipCode, city, state, plan, planStatus FROM gyms WHERE id = 1'
    );
    console.log(after[0]);

    if (result.changedRows > 0) {
      console.log('\n✅ UPDATE funcionou no MySQL!');
    } else {
      console.log('\n⚠️ UPDATE não mudou nada (valores já eram iguais)');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

testDirectUpdate();
