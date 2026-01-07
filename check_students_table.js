import mysql from 'mysql2/promise';

async function checkStudentsTable() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Verificar se tabela students existe
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'students'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Tabela students NÃO existe');
      return;
    }
    
    console.log('✅ Tabela students existe');
    
    // Contar quantos students existem
    const [count] = await connection.execute(
      'SELECT COUNT(*) as total FROM students'
    );
    
    console.log(`📊 Total de alunos: ${count[0].total}`);
    
    // Mostrar alguns alunos
    if (count[0].total > 0) {
      const [students] = await connection.execute(
        'SELECT s.id, u.name, u.email FROM students s JOIN users u ON s.userId = u.id LIMIT 5'
      );
      console.log('👥 Primeiros alunos:');
      students.forEach(s => console.log(`  - ${s.name} (${s.email})`));
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkStudentsTable();
