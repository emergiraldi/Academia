import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function createPasswordResetTable() {
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
    console.log('🔧 Criando tabela password_reset_tokens...\n');

    // Criar tabela
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        userId INT(11) NOT NULL COMMENT 'ID do usuário que solicitou',
        token VARCHAR(10) NOT NULL COMMENT 'Código de 6 dígitos',
        expiresAt DATETIME NOT NULL COMMENT 'Data/hora de expiração',
        used TINYINT(1) DEFAULT 0 COMMENT 'Se o token já foi usado',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY unique_token (token),
        INDEX idx_userId (userId),
        INDEX idx_expiresAt (expiresAt),
        INDEX idx_used (used),
        INDEX idx_token_user (token, userId),

        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela password_reset_tokens criada com sucesso!\n');

    // Verificar estrutura
    const [columns] = await connection.query('DESCRIBE password_reset_tokens');

    console.log('📋 Estrutura da tabela:');
    columns.forEach(col => {
      console.log(`  ✓ ${col.Field} (${col.Type})`);
    });

    // Verificar índices
    const [indexes] = await connection.query(`
      SHOW INDEXES FROM password_reset_tokens
    `);

    console.log('\n📊 Índices criados:');
    const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
    uniqueIndexes.forEach(idx => {
      console.log(`  ✓ ${idx}`);
    });

    console.log('\n🎉 Migração concluída!');
    console.log('\n💡 A tabela está pronta para armazenar códigos de recuperação de senha.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createPasswordResetTable().catch(console.error);
