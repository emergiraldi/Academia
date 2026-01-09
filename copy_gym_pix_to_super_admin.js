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

    // Buscar conta bancária da primeira academia (onde estão os dados PIX completos)
    const [bankAccounts] = await connection.query(`
      SELECT
        ba.id,
        ba.gymId,
        ba.titularNome,
        ba.banco,
        ba.agenciaNumero,
        ba.contaNumero,
        ba.contaDv,
        ba.pixChave,
        ba.pixTipoChave,
        ba.pixClientId,
        ba.pixClientSecret,
        ba.pixCertificado,
        ba.pixChavePrivada,
        ba.pixUrlBase,
        ba.pixUrlToken,
        g.name as gymName
      FROM bankAccounts ba
      INNER JOIN gyms g ON ba.gymId = g.id
      WHERE ba.pixChave IS NOT NULL
      ORDER BY ba.id ASC
      LIMIT 1
    `);

    if (bankAccounts.length === 0) {
      console.log('⚠️  Nenhuma conta bancária com PIX configurado encontrada.');
      console.log('💡 Configure os dados PIX em Admin > Configurações > Contas Bancárias primeiro.\n');
      return;
    }

    const bankData = bankAccounts[0];
    console.log(`✅ Usando dados da conta bancária da academia: ${bankData.gymName} (ID: ${bankData.gymId})`);
    console.log('');
    console.log('📋 Dados que serão copiados:');
    console.log(`   - Titular: ${bankData.titularNome || 'não configurado'}`);
    console.log(`   - Banco: ${bankData.banco || 'não configurado'}`);
    console.log(`   - Agência: ${bankData.agenciaNumero || 'não configurada'}`);
    console.log(`   - Conta: ${bankData.contaNumero}${bankData.contaDv ? '-' + bankData.contaDv : ''}`);
    console.log(`   - Chave PIX: ${bankData.pixChave || 'não configurada'}`);
    console.log(`   - Tipo: ${bankData.pixTipoChave || 'não configurado'}`);
    console.log(`   - Client ID: ${bankData.pixClientId ? '***configurado***' : 'não configurado'}`);
    console.log(`   - Client Secret: ${bankData.pixClientSecret ? '***configurado***' : 'não configurado'}`);
    console.log(`   - Certificado: ${bankData.pixCertificado ? `***${Buffer.byteLength(bankData.pixCertificado, 'utf8')} bytes***` : 'não configurado'}`);
    console.log(`   - Chave Privada: ${bankData.pixChavePrivada ? `***${Buffer.byteLength(bankData.pixChavePrivada, 'utf8')} bytes***` : 'não configurada'}`);
    console.log(`   - URL API: ${bankData.pixUrlBase || 'não configurada'}`);
    console.log(`   - URL Token: ${bankData.pixUrlToken || 'não configurada'}`);
    console.log('');

    // Verificar se já existe configuração no Super Admin
    const [existing] = await connection.query('SELECT id FROM superAdminSettings LIMIT 1');

    // Determinar o provider baseado na URL da API
    const pixProvider = bankData.pixUrlBase?.includes('sicoob') ? 'sicoob' :
                       bankData.pixUrlBase?.includes('gerencianet') || bankData.pixUrlBase?.includes('efi') ? 'efi' :
                       'other';

    if (existing.length > 0) {
      // Atualizar registro existente
      console.log('📝 Atualizando configurações existentes do Super Admin...');

      await connection.query(`
        UPDATE superAdminSettings
        SET
          pixProvider = ?,
          pixClientId = ?,
          pixClientSecret = ?,
          pixCertificate = ?,
          pixPrivateKey = ?,
          pixKey = ?,
          pixKeyType = ?,
          merchantName = ?,
          merchantCity = ?,
          pixApiUrl = ?,
          pixTokenUrl = ?,
          bankCode = ?,
          bankName = ?,
          bankAccount = ?,
          bankAgency = ?
        WHERE id = ?
      `, [
        pixProvider,
        bankData.pixClientId,
        bankData.pixClientSecret,
        bankData.pixCertificado,
        bankData.pixChavePrivada,
        bankData.pixChave,
        bankData.pixTipoChave || 'random',
        bankData.titularNome,
        null, // merchantCity - não temos no bankAccounts
        bankData.pixUrlBase,
        bankData.pixUrlToken,
        bankData.banco?.toString(),
        null, // bankName - podemos adicionar depois
        bankData.contaNumero ? `${bankData.contaNumero}${bankData.contaDv ? '-' + bankData.contaDv : ''}` : null,
        bankData.agenciaNumero,
        existing[0].id
      ]);

      console.log('✅ Configurações do Super Admin atualizadas com sucesso!');
    } else {
      // Criar novo registro
      console.log('📝 Criando configurações do Super Admin...');

      await connection.query(`
        INSERT INTO superAdminSettings (
          pixProvider,
          pixClientId,
          pixClientSecret,
          pixCertificate,
          pixPrivateKey,
          pixKey,
          pixKeyType,
          merchantName,
          merchantCity,
          pixApiUrl,
          pixTokenUrl,
          bankCode,
          bankName,
          bankAccount,
          bankAgency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pixProvider,
        bankData.pixClientId,
        bankData.pixClientSecret,
        bankData.pixCertificado,
        bankData.pixChavePrivada,
        bankData.pixChave,
        bankData.pixTipoChave || 'random',
        bankData.titularNome,
        null, // merchantCity
        bankData.pixUrlBase,
        bankData.pixUrlToken,
        bankData.banco?.toString(),
        null, // bankName
        bankData.contaNumero ? `${bankData.contaNumero}${bankData.contaDv ? '-' + bankData.contaDv : ''}` : null,
        bankData.agenciaNumero
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
