/**
 * Copia credenciais PIX de uma academia para o Super Admin
 * Execute: node copy_pix_to_super_admin.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function copyPixCredentials() {
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
    console.log('🔍 Procurando academia com PIX configurado...\n');

    // Buscar academia com credenciais PIX
    const [gyms] = await connection.query(`
      SELECT id, name, pixClientId, pixClientSecret, pixCertificate, pixKey, pixKeyType,
             pixApiUrl, pixTokenUrl
      FROM gyms
      WHERE pixClientId IS NOT NULL AND pixClientId != ''
      LIMIT 1
    `);

    if (gyms.length === 0) {
      console.log('❌ Nenhuma academia com PIX configurado encontrada!');
      console.log('\n💡 Configure o PIX em uma academia primeiro, depois execute este script.');
      return;
    }

    const gym = gyms[0];
    console.log(`✅ Academia encontrada: ${gym.name} (ID: ${gym.id})`);
    console.log(`   - Client ID: ${gym.pixClientId ? gym.pixClientId.substring(0, 20) + '...' : 'N/A'}`);
    console.log(`   - PIX Key: ${gym.pixKey || 'N/A'}`);
    console.log(`   - PIX Key Type: ${gym.pixKeyType || 'N/A'}`);
    console.log('');

    // Verificar se tabela superAdminSettings existe
    console.log('🔍 Verificando tabela superAdminSettings...');
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'superAdminSettings'
    `);

    if (tables.length === 0) {
      console.log('❌ Tabela superAdminSettings não existe!');
      console.log('💡 Execute o script de criação da tabela primeiro.');
      return;
    }

    console.log('✅ Tabela encontrada\n');

    // Copiar credenciais PIX para Super Admin
    console.log('📋 Copiando credenciais PIX para Super Admin...');
    await connection.query(`
      UPDATE superAdminSettings SET
        pixClientId = ?,
        pixClientSecret = ?,
        pixCertificate = ?,
        pixKey = ?,
        pixKeyType = ?,
        pixApiUrl = ?,
        pixTokenUrl = ?
      WHERE id = 1
    `, [
      gym.pixClientId,
      gym.pixClientSecret,
      gym.pixCertificate,
      gym.pixKey,
      gym.pixKeyType,
      gym.pixApiUrl || 'https://api.sicoob.com.br/pix/api/v2',
      gym.pixTokenUrl || 'https://api.sicoob.com.br/pix/oauth/token'
    ]);

    console.log('✅ Credenciais PIX copiadas com sucesso!');
    console.log('\n📊 Verificando...');

    // Verificar se foi copiado
    const [settings] = await connection.query(`
      SELECT pixClientId, pixKey, pixKeyType FROM superAdminSettings WHERE id = 1
    `);

    if (settings[0] && settings[0].pixClientId) {
      console.log('✅ SUCESSO! Credenciais PIX do Super Admin configuradas:');
      console.log(`   - Client ID: ${settings[0].pixClientId.substring(0, 20)}...`);
      console.log(`   - PIX Key: ${settings[0].pixKey}`);
      console.log(`   - PIX Key Type: ${settings[0].pixKeyType}`);
      console.log('\n🚀 Agora você pode criar academias com geração automática de PIX!');
    } else {
      console.log('❌ Erro: Credenciais não foram copiadas corretamente');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

copyPixCredentials().catch(console.error);
