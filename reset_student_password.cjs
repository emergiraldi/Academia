const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  // Senha padrão: 123456
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Atualizando senha para: 123456');

  // Atualizar senha do Emerson
  await connection.execute(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'emerson.student@giralditelecom.com.br']
  );
  console.log('✅ Senha atualizada para emerson.student@giralditelecom.com.br');

  // Atualizar senha do Max
  await connection.execute(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'max@gmail.com']
  );
  console.log('✅ Senha atualizada para max@gmail.com');

  await connection.end();

  console.log('\n=== CREDENCIAIS DE ACESSO ===');
  console.log('Email: emerson.student@giralditelecom.com.br');
  console.log('Senha: 123456');
  console.log('\nOu:');
  console.log('Email: max@gmail.com');
  console.log('Senha: 123456');
})().catch(console.error);
