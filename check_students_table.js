import mysql from 'mysql2/promise';

async function checkStudentsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('=== Estrutura da tabela students ===\n');

    const [columns] = await connection.execute('DESCRIBE students');
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(5)} | ${col.Key.padEnd(5)} | ${col.Default || 'NULL'}`);
    });

    console.log('\n=== Verificando relação com professores ===\n');

    // Check if there's a professorId column
    const hasProfessorId = columns.some(col => col.Field === 'professorId');

    if (hasProfessorId) {
      console.log('✅ Coluna professorId EXISTE na tabela students');

      // Check how many students have professors assigned
      const [stats] = await connection.execute(`
        SELECT
          COUNT(*) as total,
          COUNT(professorId) as comProfessor,
          COUNT(*) - COUNT(professorId) as semProfessor
        FROM students
      `);

      console.log(`\n📊 Estatísticas:`);
      console.log(`   Total de alunos: ${stats[0].total}`);
      console.log(`   Com professor: ${stats[0].comProfessor}`);
      console.log(`   Sem professor: ${stats[0].semProfessor}`);
    } else {
      console.log('❌ Coluna professorId NÃO EXISTE na tabela students');
      console.log('   ⚠️  PROBLEMA: Não há como vincular alunos a professores!');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkStudentsTable();
