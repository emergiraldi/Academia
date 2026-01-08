import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function resetSuperAdmin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '935559Emerson@',
    database: 'academia_db'
  });

  try {
    const newPassword = 'Admin@2026';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('🔐 Resetando senha do super admin...');
    console.log('Nova senha:', newPassword);
    console.log('Hash gerado:', hashedPassword);

    await connection.query(
      'UPDATE users SET password = ? WHERE id = 392',
      [hashedPassword]
    );

    const [rows] = await connection.query(
      'SELECT id, email, role, LEFT(password, 30) as pwd FROM users WHERE id = 392'
    );

    console.log('✅ Senha atualizada com sucesso!');
    console.log('Verificação:', rows[0]);
    console.log('');
    console.log('📧 Email: emerson@giralditelecom.com.br');
    console.log('🔑 Senha: Admin@2026');
    console.log('');
    console.log('🌐 Acesse: https://www.sysfitpro.com.br/super-admin/login');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

resetSuperAdmin().catch(console.error);
