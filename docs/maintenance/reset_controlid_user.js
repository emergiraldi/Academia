import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function resetControlIdUser(studentId) {
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
    console.log(`🔧 Resetando controlIdUserId para aluno ID ${studentId}...\n`);

    // Check current value
    const [rows] = await connection.query(`
      SELECT
        s.id,
        s.controlIdUserId,
        s.faceEnrolled,
        u.name as userName
      FROM students s
      LEFT JOIN users u ON s.userId = u.id
      WHERE s.id = ?
    `, [studentId]);

    if (Array.isArray(rows) && rows.length > 0) {
      const student = rows[0];

      console.log('📋 Dados atuais:');
      console.log(`- Aluno: ${student.userName}`);
      console.log(`- controlIdUserId: ${student.controlIdUserId || 'NULL'}`);
      console.log(`- faceEnrolled: ${student.faceEnrolled ? 'SIM' : 'NÃO'}`);

      if (student.controlIdUserId === null) {
        console.log('\n✅ controlIdUserId já está NULL. Não é necessário resetar.');
        return;
      }

      // Reset to NULL
      await connection.query(`
        UPDATE students
        SET controlIdUserId = NULL,
            faceEnrolled = 0
        WHERE id = ?
      `, [studentId]);

      console.log('\n✅ controlIdUserId resetado para NULL!');
      console.log('✅ faceEnrolled resetado para 0 (falso)!');
      console.log('\n📱 Agora você pode enviar a foto novamente pelo app.');
      console.log('🔧 O backend vai criar o usuário automaticamente no Control ID.');

    } else {
      console.log(`❌ Aluno com ID ${studentId} não encontrado.`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Get student ID from command line argument, default to 3
const studentId = parseInt(process.argv[2]) || 3;
resetControlIdUser(studentId).catch(console.error);
