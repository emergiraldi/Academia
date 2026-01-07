import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createGymSettingsTable() {
  // Try to use DATABASE_URL, fallback to localhost
  const databaseUrl = process.env.DATABASE_URL;

  let config;

  if (databaseUrl && databaseUrl.includes('@')) {
    console.log('📋 Using DATABASE_URL');

    // Try with password: mysql://user:password@host:port/database
    let match = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (match) {
      const [, user, password, host, port, database] = match;
      config = {
        host,
        port: parseInt(port),
        user,
        password,
        database
      };
    } else {
      // Try without password: mysql://user@host:port/database
      match = databaseUrl.match(/mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/);

      if (!match) {
        console.error('❌ Invalid DATABASE_URL format');
        process.exit(1);
      }

      const [, user, host, port, database] = match;
      config = {
        host,
        port: parseInt(port),
        user,
        password: '',
        database
      };
    }
  } else {
    // Localhost format
    console.log('📋 Using localhost config');
    config = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'academia_db'
    };
  }

  const conn = await mysql.createConnection(config);

  try {
    console.log('🔨 Creating gym_settings table...\n');

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS gym_settings (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        gymId INT(11) NOT NULL,
        daysToBlockAfterDue INT(11) DEFAULT 7,
        blockOnExpiredExam TINYINT(1) DEFAULT 1,
        examValidityDays INT(11) DEFAULT 90,
        minimumAge INT(11) DEFAULT 16,
        daysToStartInterest INT(11) DEFAULT 1,
        interestRatePerMonth DECIMAL(5,2) DEFAULT 2.00,
        lateFeePercentage DECIMAL(5,2) DEFAULT 2.00,
        allowInstallments TINYINT(1) DEFAULT 1,
        maxInstallments INT(11) DEFAULT 6,
        minimumInstallmentValue INT(11) DEFAULT 5000,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_gym_settings (gymId),
        FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ gym_settings table created');

    // Verify the structure
    const [columns] = await conn.execute('DESCRIBE gym_settings');
    console.log('\n=== gym_settings structure ===');
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    // Check if there are any gyms without settings
    const [gyms] = await conn.execute('SELECT id FROM gyms WHERE id NOT IN (SELECT gymId FROM gym_settings)');

    if (gyms.length > 0) {
      console.log(`\n🔧 Found ${gyms.length} gym(s) without settings. Creating default settings...`);

      for (const gym of gyms) {
        await conn.execute(
          `INSERT INTO gym_settings (
            gymId, daysToBlockAfterDue, blockOnExpiredExam, examValidityDays, minimumAge,
            daysToStartInterest, interestRatePerMonth, lateFeePercentage,
            allowInstallments, maxInstallments, minimumInstallmentValue
          ) VALUES (?, 7, 1, 90, 16, 1, 2.00, 2.00, 1, 6, 5000)`,
          [gym.id]
        );
        console.log(`  ✓ Created settings for gym ${gym.id}`);
      }
    }

    console.log('\n✅ gym_settings table created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('Table already exists, skipping creation.');
    } else {
      process.exit(1);
    }
  } finally {
    await conn.end();
  }
}

createGymSettingsTable();
