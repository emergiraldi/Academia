import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkStudentsPasswords() {
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
    console.log('🔍 Verificando senhas dos alunos...\n');

    // Get students with their users
    const [students] = await connection.query(`
      SELECT
        s.id as studentId,
        u.name as studentName,
        u.id as userId,
        u.email,
        u.password,
        u.role,
        LENGTH(u.password) as passwordLength
      FROM students s
      LEFT JOIN users u ON s.userId = u.id
      WHERE u.role = 'student'
      LIMIT 10
    `);

    console.log('📋 Alunos encontrados:');
    console.table(students.map((s) => ({
      ID: s.studentId,
      Nome: s.studentName,
      Email: s.email,
      'Hash Length': s.passwordLength,
      'Has Password': s.password ? 'Sim' : 'Não'
    })));

    // Test a few passwords
    console.log('\n🔐 Para testar uma senha específica, use:');
    console.log('node check_student_password.js email@example.com senha123\n');

    const testEmail = process.argv[2];
    const testPassword = process.argv[3];

    if (testEmail && testPassword) {
      const [user] = await connection.query(
        'SELECT id, email, password FROM users WHERE email = ? AND role = "student"',
        [testEmail]
      );

      if (Array.isArray(user) && user.length > 0) {
        const userData = user[0];
        console.log(`\n✅ Usuário encontrado: ${userData.email}`);
        console.log(`🔑 Hash no banco: ${userData.password.substring(0, 20)}...`);

        const isValid = await bcrypt.compare(testPassword, userData.password);
        console.log(`\n${isValid ? '✅' : '❌'} Senha ${isValid ? 'CORRETA' : 'INCORRETA'}`);

        if (!isValid) {
          console.log('\n💡 Sugestão: A senha no banco não corresponde à senha fornecida.');
          console.log('   Verifique se a senha tem no mínimo 6 caracteres quando foi cadastrada.');
        }
      } else {
        console.log(`\n❌ Usuário não encontrado: ${testEmail}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkStudentsPasswords().catch(console.error);
