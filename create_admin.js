// Script para criar usuário admin
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  try {
    console.log('🔐 Criando usuário admin...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'academia_db',
    });

    console.log('✅ Conectado ao banco de dados\n');

    // Verificar se a academia FitLife existe
    const [gyms] = await connection.query("SELECT id FROM gyms WHERE slug = 'fitlife'");

    let gymId;
    if (gyms.length === 0) {
      // Criar academia FitLife
      const [result] = await connection.query(
        "INSERT INTO gyms (name, slug, email, phone, address, city, state, zipCode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['Academia FitLife', 'fitlife', 'contato@fitlife.com', '(11) 98765-4321', 'Rua das Academias, 123', 'São Paulo', 'SP', '01234-567', 'active']
      );
      gymId = result.insertId;
      console.log('✅ Academia FitLife criada com ID:', gymId);
    } else {
      gymId = gyms[0].id;
      console.log('✅ Academia FitLife já existe com ID:', gymId);
    }

    // Verificar se o admin já existe
    const [existingAdmin] = await connection.query(
      "SELECT id FROM users WHERE email = 'admin@fitlife.com'"
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin já existe. Atualizando senha...');

      // Atualizar senha
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        "UPDATE users SET password = ? WHERE email = 'admin@fitlife.com'",
        [hashedPassword]
      );
      console.log('✅ Senha atualizada com sucesso!');
    } else {
      // Criar admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        "INSERT INTO users (gymId, name, email, password, role, loginMethod) VALUES (?, ?, ?, ?, ?, ?)",
        [gymId, 'Admin FitLife', 'admin@fitlife.com', hashedPassword, 'gym_admin', 'password']
      );
      console.log('✅ Admin criado com sucesso!');
    }

    console.log('\n🔑 Credenciais:');
    console.log('   Email: admin@fitlife.com');
    console.log('   Senha: admin123');
    console.log('   URL:   http://localhost:3000/fitlife/admin/login\n');

    await connection.end();
    console.log('✨ Concluído!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createAdmin();
