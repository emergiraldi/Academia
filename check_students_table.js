import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkStudent() {
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
    console.log('🔍 Verificando dados do aluno ID 3...\n');

    // Check student data with user info
    const [rows] = await connection.query(`
      SELECT
        s.id,
        s.userId,
        s.gymId,
        s.registrationNumber,
        s.controlIdUserId,
        s.faceEnrolled,
        u.name as userName,
        u.email as userEmail
      FROM students s
      LEFT JOIN users u ON s.userId = u.id
      WHERE s.id = 3
    `);

    if (Array.isArray(rows) && rows.length > 0) {
      console.log('📋 Dados do aluno:');
      console.table(rows);

      const student = rows[0];

      console.log('\n🔑 Informações importantes:');
      console.log(`- Student ID: ${student.id}`);
      console.log(`- User ID: ${student.userId}`);
      console.log(`- Gym ID: ${student.gymId}`);
      console.log(`- Control ID User ID: ${student.controlIdUserId || 'NÃO DEFINIDO (NULL)'}`);
      console.log(`- Face Enrolled: ${student.faceEnrolled ? 'SIM' : 'NÃO'}`);
      console.log(`- Nome: ${student.userName}`);
      console.log(`- Email: ${student.userEmail}`);

      if (!student.controlIdUserId) {
        console.log('\n❌ PROBLEMA ENCONTRADO!');
        console.log('O campo controlIdUserId está NULL.');
        console.log('O usuário precisa ser criado na leitora Control ID antes de enviar a foto facial.');
        console.log('\nO backend deveria criar automaticamente quando controlIdUserId é NULL.');
      } else {
        console.log('\n✅ controlIdUserId está definido.');
        console.log('Mas a leitora está retornando "User does not exist".');
        console.log('Isso significa que o usuário foi deletado da leitora ou nunca foi criado lá.');
      }

    } else {
      console.log('❌ Aluno com ID 3 não encontrado no banco de dados.');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkStudent().catch(console.error);
