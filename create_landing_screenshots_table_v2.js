import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function createLandingScreenshotsTable() {
  // Parse DATABASE_URL: mysql://username:password@host:port/database
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

  if (!match) {
    console.error('❌ DATABASE_URL não configurada corretamente!');
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database,
  });

  try {
    console.log('🔧 Criando tabela landing_page_screenshots...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS landing_page_screenshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        active CHAR(1) DEFAULT 'Y',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active_order (active, display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela landing_page_screenshots criada com sucesso!');

    // Inserir screenshots padrão
    console.log('📝 Inserindo screenshots padrão...');

    await connection.execute(`
      INSERT INTO landing_page_screenshots (title, description, image_url, display_order, active)
      VALUES
        ('Dashboard Principal', 'Visão geral com métricas importantes', '/images/screenshots/dashboard.png', 1, 'Y'),
        ('Gestão de Alunos', 'Controle completo de cadastros', '/images/screenshots/students.png', 2, 'Y'),
        ('Controle Financeiro', 'Acompanhe pagamentos em tempo real', '/images/screenshots/financial.png', 3, 'Y')
      ON DUPLICATE KEY UPDATE title = title
    `);

    console.log('✅ Screenshots padrão inseridos!');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createLandingScreenshotsTable()
  .then(() => {
    console.log('🎉 Tabela criada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro ao criar tabela:', error);
    process.exit(1);
  });
