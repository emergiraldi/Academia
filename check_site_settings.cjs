const mysql = require('mysql2/promise');

async function checkSiteSettings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Verificando configurações do site...\n');

    const [settings] = await connection.execute(
      'SELECT * FROM site_settings LIMIT 1'
    );

    if (settings.length === 0) {
      console.log('❌ Nenhuma configuração encontrada!\n');
    } else {
      const config = settings[0];
      console.log('✅ Configurações encontradas:\n');
      console.log('═══════════════════════════════════════════');
      console.log('📝 BRANDING:');
      console.log(`   Nome do Site: ${config.siteName}`);
      console.log(`   Cor Primária: ${config.primaryColor}`);
      console.log('');
      console.log('🎯 HERO:');
      console.log(`   Título: ${config.heroTitle}`);
      console.log(`   Descrição: ${config.heroDescription}`);
      console.log('');
      console.log('🖼️  BANNERS:');
      console.log(`   Banner 1 Título: ${config.banner1Title || 'Não definido'}`);
      console.log(`   Banner 1 Imagem: ${config.banner1Image ? 'Definida (' + config.banner1Image.substring(0, 50) + '...)' : 'Não definida'}`);
      console.log(`   Banner 2 Título: ${config.banner2Title || 'Não definido'}`);
      console.log(`   Banner 2 Imagem: ${config.banner2Image ? 'Definida (' + config.banner2Image.substring(0, 50) + '...)' : 'Não definida'}`);
      console.log('');
      console.log('💰 PREÇOS:');
      console.log(`   Básico: R$ ${config.basicPrice}`);
      console.log(`   Professional: R$ ${config.professionalPrice}`);
      console.log(`   Enterprise: R$ ${config.enterprisePrice}`);
      console.log('');
      console.log('📞 CONTATO:');
      console.log(`   Email: ${config.contactEmail || 'Não definido'}`);
      console.log(`   Telefone: ${config.contactPhone || 'Não definido'}`);
      console.log(`   WhatsApp: ${config.whatsappNumber || 'Não definido'}`);
      console.log('═══════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkSiteSettings();
