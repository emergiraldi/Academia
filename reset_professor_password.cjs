const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetProfessorPassword() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('Resetando senha do professor...\n');

    // Hash da senha 'prof123'
    const hashedPassword = await bcrypt.hash('prof123', 10);

    // Atualizar senha
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'carlos@fitlife.com']
    );

    console.log('✅ Senha resetada com sucesso!\n');
    console.log('Credenciais do Professor:');
    console.log('  Email: carlos@fitlife.com');
    console.log('  Senha: prof123\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetProfessorPassword();
