import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = new URL(process.env.DATABASE_URL);
const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.substring(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function updateGymCNPJ() {
  const connection = await pool.getConnection();

  try {
    console.log('📝 Atualizando CNPJ da Academia FitLife para um CNPJ válido...\n');

    // CNPJ válido para testes: 11.222.333/0001-81
    const validCNPJ = '11.222.333/0001-81';

    await connection.query(
      'UPDATE gyms SET cnpj = ? WHERE id = 1',
      [validCNPJ]
    );

    console.log('========================================');
    console.log('✅ CNPJ atualizado com sucesso!');
    console.log('========================================');
    console.log(`Novo CNPJ: ${validCNPJ}`);
    console.log('');
    console.log('Agora você pode testar a geração do PIX novamente.');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao atualizar CNPJ:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

updateGymCNPJ();
