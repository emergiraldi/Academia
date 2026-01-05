const mysql = require('mysql2/promise');
require('dotenv').config();

async function createWorkoutLogsTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('Creating workout_logs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId INT NOT NULL,
        workoutId INT NOT NULL,
        gymId INT NOT NULL,
        workoutDate TIMESTAMP NULL,
        startTime TIMESTAMP NULL,
        endTime TIMESTAMP NULL,
        duration INT,
        overallFeeling INT,
        notes TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (workoutId) REFERENCES workouts(id) ON DELETE RESTRICT,
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ workout_logs table created');

    console.log('Creating workout_log_exercises table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS workout_log_exercises (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workoutLogId INT NOT NULL,
        exerciseId INT NOT NULL,
        exerciseName VARCHAR(200) NOT NULL,
        sets TEXT NOT NULL,
        notes TEXT,
        orderIndex INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workoutLogId) REFERENCES workout_logs(id) ON DELETE CASCADE,
        FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE RESTRICT
      )
    `);
    console.log('✓ workout_log_exercises table created');

    console.log('\n✅ Workout logs tables created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createWorkoutLogsTables();
