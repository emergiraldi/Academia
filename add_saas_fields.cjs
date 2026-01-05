const mysql = require('mysql2/promise');

async function addSaaSFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Adding SaaS plan management fields to gyms table...');

    // Add plan enum column
    await connection.execute(`
      ALTER TABLE gyms
      ADD COLUMN IF NOT EXISTS plan ENUM('basic', 'professional', 'enterprise') NOT NULL DEFAULT 'basic'
    `);
    console.log('✅ Added plan column');

    // Add planStatus enum column
    await connection.execute(`
      ALTER TABLE gyms
      ADD COLUMN IF NOT EXISTS planStatus ENUM('trial', 'active', 'suspended', 'cancelled') NOT NULL DEFAULT 'trial'
    `);
    console.log('✅ Added planStatus column');

    // Add trial end date
    await connection.execute(`
      ALTER TABLE gyms
      ADD COLUMN IF NOT EXISTS trialEndsAt TIMESTAMP NULL
    `);
    console.log('✅ Added trialEndsAt column');

    // Add subscription start date
    await connection.execute(`
      ALTER TABLE gyms
      ADD COLUMN IF NOT EXISTS subscriptionStartsAt TIMESTAMP NULL
    `);
    console.log('✅ Added subscriptionStartsAt column');

    // Add next billing date
    await connection.execute(`
      ALTER TABLE gyms
      ADD COLUMN IF NOT EXISTS nextBillingDate TIMESTAMP NULL
    `);
    console.log('✅ Added nextBillingDate column');

    // Add blocked reason
    await connection.execute(`
      ALTER TABLE gyms
      ADD COLUMN IF NOT EXISTS blockedReason TEXT NULL
    `);
    console.log('✅ Added blockedReason column');

    console.log('\n✅ All SaaS fields added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addSaaSFields();
