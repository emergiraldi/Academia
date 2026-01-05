const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  console.log('\n=== Treinos Criados ===');
  const [workouts] = await conn.execute(`
    SELECT
      w.id,
      w.name,
      w.active,
      w.startDate,
      u_student.name as studentName,
      u_prof.name as professorName
    FROM workouts w
    LEFT JOIN students s ON w.studentId = s.id
    LEFT JOIN users u_student ON s.userId = u_student.id
    LEFT JOIN users u_prof ON w.professorId = u_prof.id
    ORDER BY w.createdAt DESC
    LIMIT 5
  `);

  if (workouts.length === 0) {
    console.log('❌ Nenhum treino criado ainda');
  } else {
    workouts.forEach(w => {
      console.log(`\nID: ${w.id}`);
      console.log(`Nome: ${w.name}`);
      console.log(`Aluno: ${w.studentName}`);
      console.log(`Professor: ${w.professorName}`);
      console.log(`Status: ${w.active ? '✅ ATIVO' : '❌ INATIVO'}`);
      console.log(`Início: ${w.startDate ? new Date(w.startDate).toLocaleDateString('pt-BR') : 'N/A'}`);
    });
  }

  await conn.end();
})().catch(console.error);
