import mysql from 'mysql2/promise';

async function migrateTable() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Adding missing columns to suppliers table...');

    await conn.execute(`
      ALTER TABLE suppliers
        ADD COLUMN tradeName VARCHAR(200) AFTER name,
        ADD COLUMN cellphone VARCHAR(20) AFTER phone,
        ADD COLUMN website VARCHAR(255) AFTER cellphone,
        ADD COLUMN number VARCHAR(20) AFTER address,
        ADD COLUMN complement VARCHAR(200) AFTER number,
        ADD COLUMN neighborhood VARCHAR(100) AFTER complement,
        ADD COLUMN bank VARCHAR(200) AFTER zipCode,
        ADD COLUMN bankAgency VARCHAR(20) AFTER bank,
        ADD COLUMN bankAccount VARCHAR(30) AFTER bankAgency,
        ADD COLUMN category VARCHAR(100) AFTER bankAccount
    `);

    console.log('✓ Columns added successfully!');

    // Verify the new structure
    const [columns] = await conn.execute('DESCRIBE suppliers');
    console.log('\n=== New Suppliers Table Structure ===');
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
}

migrateTable();
