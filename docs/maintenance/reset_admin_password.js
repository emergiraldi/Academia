import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    const newPassword = 'senha123';

    console.log('🔐 Resetando senhas dos administradores...\n');

    // Get all admins
    const [admins] = await connection.execute(
      'SELECT id, name, email FROM users WHERE role = "gym_admin"'
    );

    if (admins.length === 0) {
      console.log('❌ Nenhum administrador encontrado!');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update all admin passwords
    await connection.execute(
      'UPDATE users SET password = ? WHERE role = "gym_admin"',
      [hashedPassword]
    );

    console.log('✅ Senhas resetadas com sucesso!\n');
    console.log('📋 Credenciais de login:\n');

    admins.forEach(admin => {
      console.log(`👤 ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Senha: ${newPassword}`);
      console.log('');
    });

    console.log('🌐 Acesse: https://www.sysfitpro.com.br/admin/login');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

resetAdminPassword();
