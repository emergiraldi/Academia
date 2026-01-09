/**
 * Copia dados PIX de uma academia para as configurações do Super Admin
 * Execute: node copy_gym_pix_to_super_admin.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function copyGymPixToSuperAdmin() {
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
    console.log('📋 Copiando dados PIX da academia para o Super Admin...\n');

    // Listar todas as academias
    const [allGyms] = await connection.query('SELECT id, name, pixKey, pixClientId FROM gyms');

    console.log('📋 Academias cadastradas:');
    allGyms.forEach((gym, index) => {
      const hasPixKey = gym.pixKey ? '✅' : '❌';
      const hasClientId = gym.pixClientId ? '✅' : '❌';
      console.log(`   ${index + 1}. ${gym.name} (ID: ${gym.id})`);
      console.log(`      Chave PIX: ${hasPixKey} | Client ID: ${hasClientId}`);
    });
    console.log('');

    // Buscar dados PIX da primeira academia que tiver QUALQUER dado configurado
    const [gyms] = await connection.query(`
      SELECT
        id,
        name,
        pixClientId,
        pixClientSecret,
        pixCertificate,
        pixKey,
        pixKeyType,
        merchantName,
        merchantCity
      FROM gyms
      ORDER BY id ASC
      LIMIT 1
    `);

    if (gyms.length === 0) {
      console.log('⚠️  Nenhuma academia cadastrada.');
      return;
    }

    const gymData = gyms[0];
    console.log(`✅ Usando dados da academia: ${gymData.name} (ID: ${gymData.id})`);
    console.log('');
    console.log('📋 Dados que serão copiados:');
    console.log(`   - Chave PIX: ${gymData.pixKey || 'não configurada'}`);
    console.log(`   - Tipo: ${gymData.pixKeyType || 'não configurado'}`);
    console.log(`   - Beneficiário: ${gymData.merchantName || 'não configurado'}`);
    console.log(`   - Cidade: ${gymData.merchantCity || 'não configurada'}`);
    console.log(`   - Client ID: ${gymData.pixClientId ? '***configurado***' : 'não configurado'}`);
    console.log(`   - Client Secret: ${gymData.pixClientSecret ? '***configurado***' : 'não configurado'}`);
    console.log(`   - Certificado: ${gymData.pixCertificate ? '***configurado***' : 'não configurado'}`);
    console.log('');

    // Verificar se já existe configuração no Super Admin
    const [existing] = await connection.query('SELECT id FROM superAdminSettings LIMIT 1');

    if (existing.length > 0) {
      // Atualizar registro existente
      console.log('📝 Atualizando configurações existentes do Super Admin...');

      await connection.query(`
        UPDATE superAdminSettings
        SET
          pixClientId = ?,
          pixClientSecret = ?,
          pixCertificate = ?,
          pixKey = ?,
          pixKeyType = ?,
          merchantName = ?,
          merchantCity = ?
        WHERE id = ?
      `, [
        gymData.pixClientId,
        gymData.pixClientSecret,
        gymData.pixCertificate,
        gymData.pixKey,
        gymData.pixKeyType,
        gymData.merchantName,
        gymData.merchantCity,
        existing[0].id
      ]);

      console.log('✅ Configurações do Super Admin atualizadas com sucesso!');
    } else {
      // Criar novo registro
      console.log('📝 Criando configurações do Super Admin...');

      await connection.query(`
        INSERT INTO superAdminSettings (
          pixClientId,
          pixClientSecret,
          pixCertificate,
          pixKey,
          pixKeyType,
          merchantName,
          merchantCity
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        gymData.pixClientId,
        gymData.pixClientSecret,
        gymData.pixCertificate,
        gymData.pixKey,
        gymData.pixKeyType,
        gymData.merchantName,
        gymData.merchantCity
      ]);

      console.log('✅ Configurações do Super Admin criadas com sucesso!');
    }

    console.log('\n📋 Próximos passos:');
    console.log('   1. Acesse Super Admin > Configurações > Pagamentos PIX');
    console.log('   2. Verifique se os dados foram copiados corretamente');
    console.log('   3. Academias usarão estes dados para pagamento de assinatura\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

copyGymPixToSuperAdmin().catch(console.error);
