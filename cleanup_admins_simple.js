import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function cleanupAdmins() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('🔍 Verificando admins...\n');

    // Get all admins
    const [admins] = await connection.execute(
      'SELECT id, name, email FROM users WHERE role = "gym_admin"'
    );

    console.log('📋 Administradores encontrados:');
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
    console.log('');

    // Keep only emergiraldi@gmail.com
    const keepEmail = 'emergiraldi@gmail.com';

    console.log(`✅ Mantendo apenas: ${keepEmail}\n`);

    // Delete other admins
    const result = await connection.execute(
      'DELETE FROM users WHERE role = "gym_admin" AND email != ?',
      [keepEmail]
    );

    console.log(`🗑️  Admins excluídos: ${result[0].affectedRows}\n`);

    // Reset password for the remaining admin
    const hashedPassword = await bcrypt.hash('senha123', 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, keepEmail]
    );

    console.log('✅ Limpeza concluída!\n');
    console.log('📋 Credenciais do administrador:');
    console.log(`   Email: ${keepEmail}`);
    console.log(`   Senha: senha123`);
    console.log('\n🌐 Acesse: https://www.sysfitpro.com.br/admin/login');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

cleanupAdmins();
