/**
 * Verifica e copia o PIX Client Secret da Academia FitLife
 * Execute: node check_client_secret.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkAndCopyClientSecret() {
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
    console.log('🔍 Verificando PIX Client Secret na Academia FitLife...\n');

    // Buscar conta bancária com PIX configurado
    const [accounts] = await connection.query(`
      SELECT
        ba.pix_client_secret,
        ba.pix_client_id,
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
    console.log(`✅ Conta encontrada: ${account.gym_name}`);
    console.log(`   Client ID: ${account.pix_client_id ? account.pix_client_id.substring(0, 20) + '...' : 'VAZIO'}`);

    if (account.pix_client_secret && account.pix_client_secret.length > 0) {
      console.log(`   Client Secret: EXISTE (${account.pix_client_secret.length} caracteres)\n`);

      // Copiar para Super Admin
      console.log('📋 Copiando Client Secret para Super Admin...');
      await connection.query(`
        UPDATE superAdminSettings
        SET pixClientSecret = ?
        WHERE id = 1
      `, [account.pix_client_secret]);

      console.log('✅ Client Secret copiado com sucesso!\n');

      // Verificar
      const [settings] = await connection.query(`
        SELECT pixClientSecret FROM superAdminSettings WHERE id = 1
      `);

      if (settings[0] && settings[0].pixClientSecret) {
        console.log(`✅ VERIFICADO: Client Secret configurado no Super Admin (${settings[0].pixClientSecret.length} caracteres)`);
      } else {
        console.log('❌ ERRO: Client Secret não foi copiado!');
      }
    } else {
      console.log(`   Client Secret: ❌ VAZIO na tabela bank_accounts!\n`);
      console.log('💡 Você precisa configurar o Client Secret na conta bancária da Academia FitLife primeiro.');
      console.log('   Acesse: Admin → Configurações → Contas Bancárias');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

checkAndCopyClientSecret().catch(console.error);
