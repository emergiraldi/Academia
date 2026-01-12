import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

async function updateStudentPassword() {
  const email = 'emerson.student@giralditelecom.com.br';
  const newPassword = '935559Em@';

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
    console.log('🔐 Atualizando senha do aluno...\n');

    // Find user
    const [users] = await connection.query(
      'SELECT id, email, name, role FROM users WHERE email = ? AND role = "student"',
      [email]
    );

    if (!Array.isArray(users) || users.length === 0) {
      console.log(`❌ Aluno não encontrado: ${email}`);
      return;
    }

    const user = users[0];
    console.log(`✅ Aluno encontrado: ${user.name} (${user.email})`);
    console.log(`📧 User ID: ${user.id}`);

    // Hash the new password
    console.log(`\n🔒 Gerando hash da senha: "${newPassword}"`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`✅ Hash gerado: ${hashedPassword.substring(0, 20)}... (length: ${hashedPassword.length})`);

    // Update password
    console.log(`\n💾 Atualizando senha no banco de dados...`);
    await connection.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );
    console.log(`✅ Senha atualizada com sucesso!`);

    // Verify
    console.log(`\n🔍 Verificando a senha...`);
    const [updatedUsers] = await connection.query(
      'SELECT password FROM users WHERE id = ?',
      [user.id]
    );
    const updatedUser = updatedUsers[0];
    const isValid = await bcrypt.compare(newPassword, updatedUser.password);

    if (isValid) {
      console.log(`✅ Verificação OK - A senha está correta!`);
      console.log(`\n📋 Resumo:`);
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${newPassword}`);
      console.log(`   Hash length: ${updatedUser.password.length}`);
    } else {
      console.log(`❌ ERRO - A senha não corresponde ao hash!`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

updateStudentPassword().catch(console.error);
