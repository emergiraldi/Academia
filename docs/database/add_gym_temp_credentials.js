/**
 * Adiciona campos para guardar credenciais temporárias do admin da academia
 * Execute: node add_gym_temp_credentials.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function addGymTempCredentials() {
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
    console.log('🔐 Adicionando campos de credenciais temporárias em gyms...\n');

    // Verificar se os campos já existem
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM gyms WHERE Field IN ('tempAdminPassword', 'tempAdminEmail')
    `);

    if (columns.length === 2) {
      console.log('✅ Campos tempAdminPassword e tempAdminEmail já existem na tabela gyms!');
      return;
    }

    // Adicionar campo tempAdminPassword se não existir
    if (!columns.find(c => c.Field === 'tempAdminPassword')) {
      await connection.query(`
        ALTER TABLE gyms
        ADD COLUMN tempAdminPassword VARCHAR(100) DEFAULT NULL
        COMMENT 'Senha temporária do admin (limpar após enviar email)'
      `);
      console.log('✅ Campo tempAdminPassword adicionado!');
    }

    // Adicionar campo tempAdminEmail se não existir
    if (!columns.find(c => c.Field === 'tempAdminEmail')) {
      await connection.query(`
        ALTER TABLE gyms
        ADD COLUMN tempAdminEmail VARCHAR(320) DEFAULT NULL
        COMMENT 'Email do admin (para enviar credenciais)'
      `);
      console.log('✅ Campo tempAdminEmail adicionado!');
    }

    console.log('\n📝 Agora quando uma academia se cadastrar:');
    console.log('   1. Senha será gerada automaticamente');
    console.log('   2. Será salva temporariamente no banco');
    console.log('   3. Após pagamento confirmado, email será enviado');
    console.log('   4. Campos serão limpos após envio do email');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addGymTempCredentials().catch(console.error);
