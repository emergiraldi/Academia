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
    console.log('🔍 Procurando conta bancária com PIX configurado...\n');

    // Buscar conta bancária com credenciais PIX da tabela bank_accounts
    const [accounts] = await connection.query(`
      SELECT ba.*, g.name as gym_name, g.id as gym_id
      FROM bank_accounts ba
      INNER JOIN gyms g ON ba.gymId = g.id
      WHERE ba.pix_ativo = 'S'
        AND ba.pix_client_id IS NOT NULL
        AND ba.pix_client_id != ''
      LIMIT 1
    `);

    if (accounts.length === 0) {
      console.log('❌ Nenhuma conta bancária com PIX configurado encontrada!');
      console.log('\n💡 Configure o PIX em uma conta bancária primeiro, depois execute este script.');
      return;
    }

    const account = accounts[0];
    console.log(`✅ Conta bancária encontrada: ${account.gym_name} (Banco: ${account.banco})`);
    console.log(`   - Client ID: ${account.pix_client_id ? account.pix_client_id.substring(0, 20) + '...' : 'N/A'}`);
    console.log(`   - PIX Key: ${account.pix_chave || 'N/A'}`);
    console.log(`   - PIX Key Type: ${account.pix_tipo_chave || 'N/A'}`);
    console.log(`   - URL Base: ${account.pix_url_base || 'N/A'}`);
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

    // Mapear tipo de chave PIX de português para inglês
    const pixKeyTypeMap = {
      'Aleatoria': 'random',
      'CPF': 'cpf',
      'CNPJ': 'cnpj',
      'Email': 'email',
      'Telefone': 'phone'
    };

    const mappedPixKeyType = pixKeyTypeMap[account.pix_tipo_chave] || 'random';
    console.log(`🔄 Mapeando tipo de chave: "${account.pix_tipo_chave}" → "${mappedPixKeyType}"\n`);

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
      account.pix_client_id,
      account.pix_client_secret,
      account.pix_certificado,
      account.pix_chave,
      mappedPixKeyType,
      account.pix_url_base || 'https://api.sicoob.com.br/pix/api/v2',
      account.pix_url_token || 'https://api.sicoob.com.br/pix/oauth/token'
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
