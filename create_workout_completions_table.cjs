const mysql = require('mysql2/promise');
require('dotenv').config();

async function createWorkoutCompletionsTable() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('📅 Criando tabela workout_day_completions...\n');

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS workout_day_completions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        workoutId INT NOT NULL,
        studentId INT NOT NULL,
        gymId INT NOT NULL,
        dayOfWeek VARCHAR(1) NOT NULL,
        completedAt DATETIME NOT NULL,
        totalExercises INT NOT NULL,
        totalSets INT NOT NULL,
        durationSeconds INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workoutId) REFERENCES workouts(id) ON DELETE CASCADE,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
        INDEX idx_student_workout_day (studentId, workoutId, dayOfWeek, completedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela workout_day_completions criada com sucesso!');
    console.log('\n📋 Estrutura:');
    console.log('   - id: ID único da conclusão');
    console.log('   - workoutId: ID do treino');
    console.log('   - studentId: ID do aluno');
    console.log('   - gymId: ID da academia');
    console.log('   - dayOfWeek: Dia do treino (A, B, C ou D)');
    console.log('   - completedAt: Data/hora da conclusão');
    console.log('   - totalExercises: Total de exercícios concluídos');
    console.log('   - totalSets: Total de séries concluídas');
    console.log('   - durationSeconds: Duração total do treino');
    console.log('   - createdAt: Data de criação do registro');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

createWorkoutCompletionsTable();
