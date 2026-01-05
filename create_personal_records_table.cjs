const mysql = require('mysql2/promise');
require('dotenv').config();

async function createPersonalRecordsTable() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('Creating personal_records table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS personal_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId INT NOT NULL,
        exerciseId INT NOT NULL,
        gymId INT NOT NULL,
        recordType ENUM('1rm', '3rm', '5rm', 'max_reps', 'max_volume') NOT NULL,
        weight DECIMAL(6,2),
        reps INT,
        volume DECIMAL(8,2),
        workoutLogId INT,
        achievedDate TIMESTAMP NULL,
        notes TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE,
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
        FOREIGN KEY (workoutLogId) REFERENCES workout_logs(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ personal_records table created');

    console.log('\n✅ Personal records table created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createPersonalRecordsTable();
