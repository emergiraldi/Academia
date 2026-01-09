/**
 * Verifica as configurações PIX do Super Admin no banco de dados
 * Execute: node verify_pix_settings.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyPixSettings() {
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
    console.log('🔍 Verificando configurações PIX do Super Admin...\n');

    // Buscar todas as configurações PIX
    const [settings] = await connection.query(`
      SELECT
        pixClientId,
        pixClientSecret,
        pixCertificate,
        pixKey,
        pixKeyType,
        pixApiUrl,
        pixTokenUrl
      FROM superAdminSettings
      WHERE id = 1
    `);

    if (!settings || settings.length === 0) {
      console.log('❌ Nenhuma configuração encontrada na tabela superAdminSettings!');
      return;
    }

    const config = settings[0];

    console.log('📋 CONFIGURAÇÕES PIX DO SUPER ADMIN:');
    console.log('=====================================\n');

    // Client ID
    if (config.pixClientId) {
      console.log('✅ PIX Client ID: ' + config.pixClientId.substring(0, 30) + '...');
      console.log('   Tamanho: ' + config.pixClientId.length + ' caracteres\n');
    } else {
      console.log('❌ PIX Client ID: NÃO CONFIGURADO\n');
    }

    // Client Secret
    if (config.pixClientSecret) {
      console.log('✅ PIX Client Secret: ' + (config.pixClientSecret.length > 0 ? 'CONFIGURADO' : 'VAZIO'));
      console.log('   Tamanho: ' + config.pixClientSecret.length + ' caracteres\n');
    } else {
      console.log('❌ PIX Client Secret: NÃO CONFIGURADO\n');
    }

    // Certificado
    if (config.pixCertificate) {
      const certLines = config.pixCertificate.split('\n').length;
      const hasCertHeader = config.pixCertificate.includes('-----BEGIN CERTIFICATE-----');
      const hasCertFooter = config.pixCertificate.includes('-----END CERTIFICATE-----');

      console.log('✅ PIX Certificate: CONFIGURADO');
      console.log('   Tamanho: ' + config.pixCertificate.length + ' caracteres');
      console.log('   Linhas: ' + certLines);
      console.log('   Header válido: ' + (hasCertHeader ? 'SIM' : 'NÃO'));
      console.log('   Footer válido: ' + (hasCertFooter ? 'SIM' : 'NÃO'));

      if (hasCertHeader && hasCertFooter) {
        console.log('   ✅ Certificado parece estar completo e válido\n');
      } else {
        console.log('   ⚠️ Certificado pode estar incompleto\n');
      }
    } else {
      console.log('❌ PIX Certificate: NÃO CONFIGURADO\n');
    }

    // Chave PIX
    if (config.pixKey) {
      console.log('✅ PIX Key: ' + config.pixKey);
      console.log('   Tipo: ' + (config.pixKeyType || 'NÃO ESPECIFICADO') + '\n');
    } else {
      console.log('❌ PIX Key: NÃO CONFIGURADA\n');
    }

    // URLs
    if (config.pixApiUrl) {
      console.log('✅ PIX API URL: ' + config.pixApiUrl + '\n');
    } else {
      console.log('❌ PIX API URL: NÃO CONFIGURADA\n');
    }

    if (config.pixTokenUrl) {
      console.log('✅ PIX Token URL: ' + config.pixTokenUrl + '\n');
    } else {
      console.log('❌ PIX Token URL: NÃO CONFIGURADA\n');
    }

    // Resumo
    console.log('=====================================');
    const allConfigured = config.pixClientId &&
                         config.pixCertificate &&
                         config.pixKey &&
                         config.pixKeyType &&
                         config.pixApiUrl &&
                         config.pixTokenUrl;

    if (allConfigured) {
      console.log('✅ TODAS as configurações PIX estão presentes!');
      console.log('🚀 Sistema pronto para gerar PIX automaticamente!\n');
    } else {
      console.log('⚠️  ATENÇÃO: Algumas configurações estão faltando!');
      console.log('💡 Execute o script copy_gym_pix_to_super_admin.js para copiar as credenciais.\n');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

verifyPixSettings().catch(console.error);
