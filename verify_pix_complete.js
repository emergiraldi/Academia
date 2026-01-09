/**
 * Verifica se todas as credenciais PIX necessárias estão presentes
 * Execute: node verify_pix_complete.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyComplete() {
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
    console.log('🔍 Verificando credenciais PIX completas...\n');

    // Verificar banco de dados da Academia FitLife
    const [accounts] = await connection.query(`
      SELECT
        ba.pix_client_id,
        ba.pix_certificado,
        ba.pix_chave_privada,
        ba.pix_chave,
        ba.pix_tipo_chave,
        ba.pix_url_base,
        ba.pix_url_token,
        g.name as gym_name
      FROM bank_accounts ba
      INNER JOIN gyms g ON ba.gymId = g.id
      WHERE ba.pix_ativo = 'S'
        AND ba.pix_client_id IS NOT NULL
        AND ba.pix_client_id != ''
      LIMIT 1
    `);

    if (accounts.length === 0) {
      console.log('❌ Nenhuma conta bancária com PIX encontrada!');
      return;
    }

    const account = accounts[0];

    console.log('📋 CREDENCIAIS PIX - ACADEMIA FITLIFE');
    console.log('=====================================\n');

    console.log(`✅ Academia: ${account.gym_name}`);
    console.log(`✅ Client ID: ${account.pix_client_id?.substring(0, 30)}...`);
    console.log(`✅ Chave PIX: ${account.pix_chave} (${account.pix_tipo_chave})`);
    console.log(`✅ URL API: ${account.pix_url_base}`);
    console.log(`✅ URL Token: ${account.pix_url_token}\n`);

    // Verificar certificado
    if (account.pix_certificado) {
      const certSize = account.pix_certificado.length;
      const hasCertHeader = account.pix_certificado.includes('-----BEGIN CERTIFICATE-----');
      console.log(`✅ Certificado: PRESENTE (${certSize} chars, header: ${hasCertHeader ? 'OK' : 'ERRO'})`);
    } else {
      console.log('❌ Certificado: AUSENTE');
    }

    // Verificar chave privada
    if (account.pix_chave_privada) {
      const keySize = account.pix_chave_privada.length;
      const hasKeyHeader = account.pix_chave_privada.includes('-----BEGIN');
      console.log(`✅ Chave Privada: PRESENTE (${keySize} chars, header: ${hasKeyHeader ? 'OK' : 'ERRO'})\n`);
    } else {
      console.log('❌ Chave Privada: AUSENTE\n');
    }

    // Verificar Super Admin Settings
    const [settings] = await connection.query(`
      SELECT
        pixClientId,
        pixClientSecret,
        pixCertificate,
        pixPrivateKey,
        pixKey,
        pixKeyType,
        pixApiUrl,
        pixTokenUrl
      FROM superAdminSettings
      WHERE id = 1
    `);

    console.log('📋 CREDENCIAIS PIX - SUPER ADMIN');
    console.log('=====================================\n');

    if (settings[0]) {
      const s = settings[0];

      console.log(`${s.pixClientId ? '✅' : '❌'} Client ID: ${s.pixClientId ? s.pixClientId.substring(0, 30) + '...' : 'AUSENTE'}`);
      console.log(`${s.pixCertificate ? '✅' : '❌'} Certificado: ${s.pixCertificate ? 'PRESENTE (' + s.pixCertificate.length + ' chars)' : 'AUSENTE'}`);
      console.log(`${s.pixPrivateKey ? '✅' : '❌'} Chave Privada: ${s.pixPrivateKey ? 'PRESENTE (' + s.pixPrivateKey.length + ' chars)' : 'AUSENTE'}`);
      console.log(`${s.pixKey ? '✅' : '❌'} Chave PIX: ${s.pixKey || 'AUSENTE'}`);
      console.log(`${s.pixKeyType ? '✅' : '❌'} Tipo Chave: ${s.pixKeyType || 'AUSENTE'}`);
      console.log(`${s.pixApiUrl ? '✅' : '❌'} URL API: ${s.pixApiUrl || 'AUSENTE'}`);
      console.log(`${s.pixTokenUrl ? '✅' : '❌'} URL Token: ${s.pixTokenUrl || 'AUSENTE'}\n`);

      // Verificar se precisa copiar chave privada
      if (account.pix_chave_privada && !s.pixPrivateKey) {
        console.log('🔄 Chave privada encontrada na Academia FitLife mas ausente no Super Admin!');
        console.log('📋 Copiando chave privada...\n');

        await connection.query(`
          UPDATE superAdminSettings
          SET pixPrivateKey = ?
          WHERE id = 1
        `, [account.pix_chave_privada]);

        console.log('✅ Chave privada copiada com sucesso!\n');
      }

      // Status final
      const allPresent = s.pixClientId && s.pixCertificate && s.pixPrivateKey &&
                        s.pixKey && s.pixKeyType && s.pixApiUrl && s.pixTokenUrl;

      console.log('=====================================');
      if (allPresent) {
        console.log('✅ TODAS as credenciais estão configuradas!');
        console.log('🚀 Sistema pronto para gerar PIX via Sicoob!\n');
        console.log('ℹ️  NOTA: Sicoob não usa Client Secret (autenticação via mTLS)');
      } else {
        console.log('⚠️  Algumas credenciais estão faltando!');
        console.log('💡 Execute: node copy_gym_pix_to_super_admin.js');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

verifyComplete().catch(console.error);
