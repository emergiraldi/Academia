const mysql = require('mysql2/promise');
require('dotenv').config();

async function createExerciseMediaTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('Creating exercise_photos table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exercise_photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exerciseId INT NOT NULL,
        photoUrl TEXT NOT NULL,
        caption VARCHAR(200),
        orderIndex INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ exercise_photos table created');

    console.log('\nCreating exercise_videos table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exercise_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exerciseId INT NOT NULL,
        createdBy INT NOT NULL,
        videoUrl TEXT NOT NULL,
        thumbnailUrl TEXT,
        title VARCHAR(200),
        durationSeconds INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    console.log('✓ exercise_videos table created');

    console.log('\n✅ Exercise media tables created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createExerciseMediaTables();
