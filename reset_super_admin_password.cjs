const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetSuperAdminPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Resetando senha do super admin...\n');

    const email = 'emerson@giralditelecom.com.br';
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await connection.execute(
      "UPDATE users SET password = ? WHERE email = ? AND role = 'super_admin'",
      [hashedPassword, email]
    );

    console.log('✅ Senha resetada com sucesso!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email:    ' + email);
    console.log('🔑 Senha:    ' + newPassword);
    console.log('🔗 URL:      http://localhost:3000/super-admin/login');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

resetSuperAdminPassword();
