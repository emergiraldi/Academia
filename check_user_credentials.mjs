import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'academia',
  password: 'Academia2026Secure',
  database: 'academia_db'
});

const email = process.argv[2];

if (!email) {
  console.error('❌ Uso: node check_user_credentials.mjs <email>');
  process.exit(1);
}

console.log(`\n🔍 Verificando usuário: ${email}\n`);

const [users] = await conn.execute(
  'SELECT id, email, role, gymId, openId, password IS NOT NULL as hasPassword, createdAt FROM users WHERE email = ?',
  [email]
);

if (users.length === 0) {
  console.log('❌ USUÁRIO NÃO ENCONTRADO no banco de dados!');
  console.log(`\n📧 Email "${email}" não existe.\n`);
} else {
  const user = users[0];
  console.log('✅ USUÁRIO ENCONTRADO:');
  console.log(`\n┌─────────────────────────────────────────────┐`);
  console.log(`│ ID:           ${user.id}`);
  console.log(`│ Email:        ${user.email}`);
  console.log(`│ Role:         ${user.role}`);
  console.log(`│ GymID:        ${user.gymId || 'null (super admin?)'}`);
  console.log(`│ OpenID:       ${user.openId || 'null'}`);
  console.log(`│ Tem senha:    ${user.hasPassword ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`│ Criado em:    ${user.createdAt}`);
  console.log(`└─────────────────────────────────────────────┘\n`);

  if (!user.hasPassword) {
    console.log('⚠️  PROBLEMA: Usuário não tem senha cadastrada!');
    console.log('   Isso significa que a senha está NULL no banco.\n');
  }
}

await conn.end();
