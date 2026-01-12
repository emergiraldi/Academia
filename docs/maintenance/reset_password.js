import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    const email = 'carlos@fitlife.com';
    const newPassword = 'senha123';

    console.log('🔐 Resetando senha...\n');
    console.log(`Email: ${email}`);
    console.log(`Nova senha: ${newPassword}\n`);

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    console.log('✅ Senha resetada com sucesso!\n');
    console.log('📋 Credenciais de login:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${newPassword}`);
    console.log('\n🌐 Acesse: https://www.sysfitpro.com.br/professor/login');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

resetPassword();
