const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkSuperAdmin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Verificando usuário super admin...\n');

    // Buscar super admin
    const [superAdmins] = await connection.execute(
      "SELECT id, email, name, role FROM users WHERE role = 'super_admin'"
    );

    if (superAdmins.length === 0) {
      console.log('❌ Nenhum super admin encontrado!');
      console.log('\n📝 Criando super admin padrão...\n');

      // Criar super admin
      const email = 'admin@sysfit.com.br';
      const password = 'admin123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await connection.execute(
        `INSERT INTO users (gymId, openId, email, password, name, role)
         VALUES (NULL, ?, ?, ?, ?, ?)`,
        [
          `super-admin-${Date.now()}`,
          email,
          hashedPassword,
          'Super Admin',
          'super_admin'
        ]
      );

      console.log('✅ Super Admin criado com sucesso!\n');
      console.log('📧 Email: ' + email);
      console.log('🔑 Senha: ' + password);
      console.log('🔗 URL: http://localhost:3000/super-admin/login\n');
    } else {
      console.log('✅ Super admin encontrado:\n');
      superAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. Nome: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}\n`);
      });
      console.log('⚠️  A senha do super admin foi definida quando foi criado.');
      console.log('    Se esqueceu a senha, você pode redefinir no banco de dados.\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkSuperAdmin();
