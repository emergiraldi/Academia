import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateWellhubTables() {
  // Parse DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('📋 DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  // Parse connection string: mysql://user:password@host:port/database
  const match = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

  if (!match) {
    console.error('❌ Invalid DATABASE_URL format');
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  const conn = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database
  });

  try {
    console.log('Creating Wellhub tables...\n');

    // 1. Tabela de configurações Wellhub
    console.log('Creating wellhub_settings table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS wellhub_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gymId INT NOT NULL,
        apiToken VARCHAR(500) NOT NULL,
        wellhubGymId VARCHAR(100) NOT NULL,
        environment ENUM('sandbox', 'production') NOT NULL DEFAULT 'sandbox',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_gym (gymId),
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ wellhub_settings created');

    // 2. Tabela de membros Wellhub
    console.log('Creating wellhub_members table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS wellhub_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gymId INT NOT NULL,
        wellhubId VARCHAR(20) NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        customCode VARCHAR(13),
        status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
        firstVisit TIMESTAMP NULL,
        lastCheckIn TIMESTAMP NULL,
        totalVisits INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        controlIdUserId INT,
        faceEnrolled BOOLEAN NOT NULL DEFAULT FALSE,
        faceImageUrl TEXT,
        UNIQUE KEY unique_wellhub_member (gymId, wellhubId),
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
        INDEX idx_customCode (gymId, customCode),
        INDEX idx_status (gymId, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ wellhub_members created');

    // 3. Tabela de check-ins Wellhub
    console.log('Creating wellhub_checkins table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS wellhub_checkins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wellhubMemberId INT NOT NULL,
        gymId INT NOT NULL,
        wellhubId VARCHAR(20) NOT NULL,
        checkInTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        validatedAt TIMESTAMP NULL,
        validationStatus ENUM('pending', 'validated', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
        validationResponse TEXT,
        method ENUM('app', 'custom_code', 'manual') NOT NULL DEFAULT 'app',
        createdBy INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wellhubMemberId) REFERENCES wellhub_members(id) ON DELETE CASCADE,
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_member (wellhubMemberId),
        INDEX idx_gym_date (gymId, checkInTime),
        INDEX idx_validation (validationStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ wellhub_checkins created');

    console.log('\n=== Verifying Wellhub Tables ===\n');

    // Verify wellhub_settings
    const [settingsColumns] = await conn.execute('DESCRIBE wellhub_settings');
    console.log('wellhub_settings structure:');
    settingsColumns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    console.log('\nwellhub_members structure:');
    const [membersColumns] = await conn.execute('DESCRIBE wellhub_members');
    membersColumns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    console.log('\nwellhub_checkins structure:');
    const [checkinsColumns] = await conn.execute('DESCRIBE wellhub_checkins');
    checkinsColumns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    console.log('\n✅ All Wellhub tables created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrateWellhubTables();
