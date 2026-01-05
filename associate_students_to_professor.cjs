const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  // Buscar o professor (Emerson - userId 1985)
  const [professors] = await conn.execute(`
    SELECT id, name, email FROM users WHERE role = 'professor' LIMIT 1
  `);

  if (professors.length === 0) {
    console.log('❌ Nenhum professor encontrado no sistema!');
    await conn.end();
    return;
  }

  const professor = professors[0];
  console.log(`\n✅ Professor encontrado: ${professor.name} (ID: ${professor.id})`);

  // Atualizar todos os alunos para terem esse professor
  const [result] = await conn.execute(`
    UPDATE students SET professorId = ? WHERE professorId IS NULL
  `, [professor.id]);

  console.log(`✅ ${result.affectedRows} aluno(s) associado(s) ao professor ${professor.name}`);

  // Mostrar os alunos
  const [students] = await conn.execute(`
    SELECT s.id, u.name, u.email, s.professorId
    FROM students s
    LEFT JOIN users u ON s.userId = u.id
    WHERE s.professorId = ?
  `, [professor.id]);

  console.log(`\n📋 Alunos do professor ${professor.name}:`);
  students.forEach(s => {
    console.log(`  - ${s.name} (${s.email})`);
  });

  await conn.end();
})().catch(console.error);
