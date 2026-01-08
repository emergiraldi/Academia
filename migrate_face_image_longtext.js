import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrateFaceImageToLongtext() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
  const url = new URL(dbUrl);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1)
  });

  try {
    console.log('🔍 Verificando tipo atual da coluna faceImageUrl...\n');

    // Check current column type
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM students WHERE Field = 'faceImageUrl'
    `);

    if (Array.isArray(columns) && columns.length > 0) {
      console.log('📋 Tipo atual:');
      console.table(columns);

      const currentType = columns[0].Type;

      if (currentType.toLowerCase() === 'longtext') {
        console.log('\n✅ A coluna faceImageUrl já é do tipo LONGTEXT!');
        return;
      }
    }

    console.log('\n🔧 Alterando coluna faceImageUrl para LONGTEXT...');
    console.log('⚠️  Isso pode demorar se houver muitos registros.\n');

    // Alter column to LONGTEXT
    await connection.query(`
      ALTER TABLE students
      MODIFY COLUMN faceImageUrl LONGTEXT
    `);

    console.log('✅ Coluna alterada com sucesso!\n');

    // Verify change
    console.log('📋 Verificando alteração...');
    const [newColumns] = await connection.query(`
      SHOW COLUMNS FROM students WHERE Field = 'faceImageUrl'
    `);
    console.table(newColumns);

    console.log('\n🎉 Migração concluída!');
    console.log('Agora faceImageUrl suporta imagens base64 de até 4GB');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrateFaceImageToLongtext().catch(console.error);
