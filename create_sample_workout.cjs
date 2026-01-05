const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSampleWorkout() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Student ID do Emerson
    const studentId = 3;
    const gymId = 1;

    // Buscar um professor
    const [professors] = await conn.execute(`
      SELECT id FROM users WHERE role = 'professor' LIMIT 1
    `);

    if (professors.length === 0) {
      console.error('❌ Nenhum professor encontrado');
      return;
    }

    const professorId = professors[0].id;

    console.log('🏋️  Criando treino ABCD de exemplo para Emerson...\n');

    // Criar o treino
    const [workout] = await conn.execute(`
      INSERT INTO workouts (studentId, gymId, professorId, name, description, startDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, CURDATE(), NOW(), NOW())
    `, [
      studentId,
      gymId,
      professorId,
      'Treino ABCD - Hipertrofia',
      'Treino completo dividido em 4 dias focado em hipertrofia muscular'
    ]);

    const workoutId = workout.insertId;
    console.log(`✅ Treino criado (ID: ${workoutId})`);

    // Buscar alguns exercícios
    const [exercises] = await conn.execute(`
      SELECT id, name, muscleGroup
      FROM exercises
      WHERE gymId = ?
      ORDER BY RAND()
      LIMIT 20
    `, [gymId]);

    console.log(`\n📋 Adicionando exercícios:\n`);

    // Dia A - Peito e Tríceps
    const dayAExercises = exercises.slice(0, 5);
    for (let i = 0; i < dayAExercises.length; i++) {
      await conn.execute(`
        INSERT INTO workout_exercises
        (workoutId, exerciseId, dayOfWeek, sets, reps, restSeconds, orderIndex, createdAt)
        VALUES (?, ?, 'A', 4, 12, 90, ?, NOW())
      `, [workoutId, dayAExercises[i].id, i]);
      console.log(`  A${i+1}. ${dayAExercises[i].name} (${dayAExercises[i].muscleGroup || 'N/A'})`);
    }

    // Dia B - Costas e Bíceps
    const dayBExercises = exercises.slice(5, 10);
    for (let i = 0; i < dayBExercises.length; i++) {
      await conn.execute(`
        INSERT INTO workout_exercises
        (workoutId, exerciseId, dayOfWeek, sets, reps, restSeconds, orderIndex, createdAt)
        VALUES (?, ?, 'B', 4, 10, 90, ?, NOW())
      `, [workoutId, dayBExercises[i].id, i]);
      console.log(`  B${i+1}. ${dayBExercises[i].name} (${dayBExercises[i].muscleGroup || 'N/A'})`);
    }

    // Dia C - Pernas
    const dayCExercises = exercises.slice(10, 15);
    for (let i = 0; i < dayCExercises.length; i++) {
      await conn.execute(`
        INSERT INTO workout_exercises
        (workoutId, exerciseId, dayOfWeek, sets, reps, restSeconds, orderIndex, createdAt)
        VALUES (?, ?, 'C', 4, 15, 120, ?, NOW())
      `, [workoutId, dayCExercises[i].id, i]);
      console.log(`  C${i+1}. ${dayCExercises[i].name} (${dayCExercises[i].muscleGroup || 'N/A'})`);
    }

    // Dia D - Ombros e Abdômen
    const dayDExercises = exercises.slice(15, 20);
    for (let i = 0; i < dayDExercises.length; i++) {
      await conn.execute(`
        INSERT INTO workout_exercises
        (workoutId, exerciseId, dayOfWeek, sets, reps, restSeconds, orderIndex, createdAt)
        VALUES (?, ?, 'D', 3, 12, 60, ?, NOW())
      `, [workoutId, dayDExercises[i].id, i]);
      console.log(`  D${i+1}. ${dayDExercises[i].name} (${dayDExercises[i].muscleGroup || 'N/A'})`);
    }

    console.log('\n✅ Treino ABCD criado com sucesso!');
    console.log(`\n📊 Resumo:`);
    console.log(`   Treino: "Treino ABCD - Hipertrofia"`);
    console.log(`   Aluno: Emerson Giraldi (ID: ${studentId})`);
    console.log(`   Total de exercícios: 20`);
    console.log(`   Dia A: 5 exercícios (4 séries, 12 reps, 90s descanso)`);
    console.log(`   Dia B: 5 exercícios (4 séries, 10 reps, 90s descanso)`);
    console.log(`   Dia C: 5 exercícios (4 séries, 15 reps, 120s descanso)`);
    console.log(`   Dia D: 5 exercícios (3 séries, 12 reps, 60s descanso)`);
    console.log(`\n🎉 Agora faça login como aluno e teste a interface!`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

createSampleWorkout();
