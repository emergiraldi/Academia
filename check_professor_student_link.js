import mysql from 'mysql2/promise';

async function checkProfessorStudentLink() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('=== Verificando vinculação Professor-Aluno ===\n');

    // List all professors (users with role='professor')
    const [professors] = await connection.execute(`
      SELECT id, name, email, role FROM users WHERE role = 'professor'
    `);

    console.log('📋 Professores cadastrados:');
    professors.forEach(prof => {
      console.log(`   ID: ${prof.id} - ${prof.name} (${prof.email})`);
    });
    console.log('');

    // List all students with their professor assignment
    const [students] = await connection.execute(`
      SELECT
        s.id,
        u.name as studentName,
        s.professorId,
        p.name as professorName
      FROM students s
      JOIN users u ON s.userId = u.id
      LEFT JOIN users p ON s.professorId = p.id
      ORDER BY s.id
    `);

    console.log('👥 Alunos e seus professores:');
    students.forEach(student => {
      const profInfo = student.professorId
        ? `Professor: ${student.professorName} (ID: ${student.professorId})`
        : '❌ SEM PROFESSOR VINCULADO';
      console.log(`   Aluno ID ${student.id}: ${student.studentName} - ${profInfo}`);
    });
    console.log('');

    // Summary
    const studentsWithProf = students.filter(s => s.professorId !== null);
    const studentsWithoutProf = students.filter(s => s.professorId === null);

    console.log('📊 Resumo:');
    console.log(`   Total de alunos: ${students.length}`);
    console.log(`   Com professor: ${studentsWithProf.length}`);
    console.log(`   Sem professor: ${studentsWithoutProf.length}`);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkProfessorStudentLink();
