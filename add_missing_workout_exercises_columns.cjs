const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  console.log('Adicionando colunas faltantes na tabela workout_exercises...\n');

  try {
    // Adicionar coluna load
    await conn.execute(`
      ALTER TABLE workout_exercises
      ADD COLUMN load VARCHAR(50) NULL AFTER reps
    `);
    console.log('✅ Coluna load adicionada');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Coluna load já existe');
    } else {
      console.error('❌ Erro ao adicionar load:', error.message);
    }
  }

  try {
    // Adicionar coluna technique
    await conn.execute(`
      ALTER TABLE workout_exercises
      ADD COLUMN technique ENUM('normal', 'dropset', 'superset', 'giant_set', 'rest_pause', 'pyramidal') NULL DEFAULT 'normal' AFTER restSeconds
    `);
    console.log('✅ Coluna technique adicionada');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Coluna technique já existe');
    } else {
      console.error('❌ Erro ao adicionar technique:', error.message);
    }
  }

  try {
    // Adicionar coluna supersetWith
    await conn.execute(`
      ALTER TABLE workout_exercises
      ADD COLUMN supersetWith INT NULL AFTER technique
    `);
    console.log('✅ Coluna supersetWith adicionada');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Coluna supersetWith já existe');
    } else {
      console.error('❌ Erro ao adicionar supersetWith:', error.message);
    }
  }

  console.log('\n✅ Todas as colunas foram adicionadas com sucesso!');
  await conn.end();
})().catch(console.error);
