const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  console.log('\n=== Alunos cadastrados ===');
  const [students] = await conn.execute(`
    SELECT s.id, s.professorId, u.name, u.email
    FROM students s
    LEFT JOIN users u ON s.userId = u.id
    LIMIT 10
  `);

  if (students.length === 0) {
    console.log('❌ Nenhum aluno encontrado!');
  } else {
    students.forEach(s => {
      console.log(`ID: ${s.id} | Prof: ${s.professorId || 'SEM PROF'} | ${s.name || 'SEM NOME'} (${s.email || 'sem email'})`);
    });
  }

  console.log('\n=== Usuários professores ===');
  const [profs] = await conn.execute(`
    SELECT id, name, email, role
    FROM users
    WHERE role = 'professor'
    LIMIT 5
  `);

  if (profs.length === 0) {
    console.log('❌ Nenhum professor encontrado!');
  } else {
    profs.forEach(p => {
      console.log(`ID: ${p.id} | ${p.name} (${p.email})`);
    });
  }

  await conn.end();
})().catch(console.error);
