const mysql = require('mysql2/promise');
require('dotenv').config();

async function recreateAssessmentsTable() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('Dropping existing physical_assessments table...');
    await connection.execute('DROP TABLE IF EXISTS physical_assessments');
    console.log('✓ Table dropped');

    console.log('\nCreating new physical_assessments table with correct schema...');
    await connection.execute(`
      CREATE TABLE physical_assessments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId INT NOT NULL,
        professorId INT NOT NULL,
        gymId INT NOT NULL,
        assessmentDate TIMESTAMP NOT NULL,

        weight DECIMAL(5,2),
        height DECIMAL(5,2),
        bodyFat DECIMAL(4,2),
        muscleMass DECIMAL(5,2),

        chest DECIMAL(5,2),
        waist DECIMAL(5,2),
        hips DECIMAL(5,2),
        rightArm DECIMAL(5,2),
        leftArm DECIMAL(5,2),
        rightThigh DECIMAL(5,2),
        leftThigh DECIMAL(5,2),
        rightCalf DECIMAL(5,2),
        leftCalf DECIMAL(5,2),

        tricepsSkinfold DECIMAL(4,2),
        subscapularSkinfold DECIMAL(4,2),
        pectoralSkinfold DECIMAL(4,2),
        midaxillarySkinfold DECIMAL(4,2),
        suprailiacSkinfold DECIMAL(4,2),
        abdominalSkinfold DECIMAL(4,2),
        thighSkinfold DECIMAL(4,2),

        flexibility DECIMAL(5,2),
        pushups INT,
        plankSeconds INT,
        vo2max DECIMAL(5,2),

        photoFront VARCHAR(500),
        photoSide VARCHAR(500),
        photoBack VARCHAR(500),

        goals TEXT,
        notes TEXT,
        nextAssessmentDate TIMESTAMP NULL DEFAULT NULL,

        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (professorId) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Table created successfully');

    console.log('\n✅ Physical assessments table recreated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

recreateAssessmentsTable();
