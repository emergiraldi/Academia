const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Adicionando coluna professorId na tabela students...');

    await conn.execute(`
      ALTER TABLE students
      ADD COLUMN professorId INT NULL AFTER userId,
      ADD FOREIGN KEY (professorId) REFERENCES users(id) ON DELETE SET NULL
    `);

    console.log('✅ Coluna professorId adicionada com sucesso!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Coluna professorId já existe!');
    } else {
      console.error('❌ Erro:', error.message);
    }
  }

  await conn.end();
})().catch(console.error);
