const mysql = require('mysql2/promise');

async function createSiteSettingsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Creating site_settings table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_name VARCHAR(200) DEFAULT 'SysFit Pro' NOT NULL,
        logo_url TEXT,
        primary_color VARCHAR(7) DEFAULT '#6366f1' NOT NULL,
        secondary_color VARCHAR(7) DEFAULT '#8b5cf6' NOT NULL,
        hero_title VARCHAR(255) DEFAULT 'Sistema Completo para Academias Modernas' NOT NULL,
        hero_subtitle VARCHAR(255) DEFAULT 'Gerencie sua academia com eficiência total' NOT NULL,
        hero_description TEXT,
        banner1_title VARCHAR(255),
        banner1_description TEXT,
        banner1_image TEXT,
        banner2_title VARCHAR(255),
        banner2_description TEXT,
        banner2_image TEXT,
        basic_price INT DEFAULT 149 NOT NULL,
        professional_price INT DEFAULT 299 NOT NULL,
        enterprise_price INT DEFAULT 599 NOT NULL,
        contact_email VARCHAR(320),
        contact_phone VARCHAR(20),
        whatsapp_number VARCHAR(20),
        facebook_url VARCHAR(500),
        instagram_url VARCHAR(500),
        linkedin_url VARCHAR(500),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);

    console.log('✅ site_settings table created successfully!');

    // Insert default values
    await connection.execute(`
      INSERT IGNORE INTO site_settings (id, hero_description, banner1_title, banner1_description, banner2_title, banner2_description, contact_email, contact_phone, whatsapp_number)
      VALUES (
        1,
        'Controle biométrico Control ID, integração Wellhub, PIX automático e app mobile para alunos.',
        'Control ID - Reconhecimento Facial',
        'Integração com Control ID para controle de acesso biométrico',
        'Integração Wellhub (Gympass)',
        'Sincronização automática com Wellhub',
        'contato@sysfit.com.br',
        '(11) 99999-9999',
        '5511999999999'
      )
    `);

    console.log('✅ Default settings inserted!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

createSiteSettingsTable();
