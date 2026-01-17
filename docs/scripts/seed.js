// Script para inserir dados iniciais no banco
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runSeed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'academia_db',
      multipleStatements: true
    });

    console.log('✅ Conectado ao banco de dados\n');

    // Ler o arquivo seed_data.sql
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const seedSQL = readFileSync(join(__dirname, 'seed_data.sql'), 'utf8');

    // Remover o 'USE academia_db;' pois já estamos conectados ao banco
    const cleanSQL = seedSQL.replace('USE academia_db;', '');

    console.log('📝 Executando script de seed...\n');

    await connection.query(cleanSQL);

    console.log('✅ Dados inseridos com sucesso!\n');

    // Verificar dados inseridos
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    const [students] = await connection.query('SELECT id, registrationNumber FROM students');
    const [plans] = await connection.query('SELECT id, name FROM plans');

    console.log('📊 Resumo:');
    console.log(`   - ${users.length} usuários criados`);
    console.log(`   - ${students.length} aluno(s) criado(s)`);
    console.log(`   - ${plans.length} plano(s) criado(s)\n`);

    console.log('👥 Usuários:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n🔑 Credenciais de acesso:');
    console.log('   Admin:     admin@fitlife.com / admin123');
    console.log('   Professor: carlos@fitlife.com / prof123');
    console.log('   Aluno:     joao@email.com / aluno123\n');

    await connection.end();
    console.log('✨ Seed concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error.message);
    process.exit(1);
  }
}

runSeed();
