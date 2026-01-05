import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  // Parse DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
  const url = new URL(dbUrl);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1), // Remove leading /
  });

  console.log('\n=== DADOS DAS ACADEMIAS NO BANCO ===\n');

  const [rows] = await connection.execute('SELECT * FROM gyms');

  for (const row of rows) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', row.id);
    console.log('Nome:', row.name);
    console.log('Slug:', row.slug);
    console.log('CNPJ:', row.cnpj);
    console.log('Email:', row.email);
    console.log('Email de Contato:', row.contactEmail);
    console.log('Telefone de Contato:', row.contactPhone);
    console.log('Telefone:', row.phone);
    console.log('Endereço:', row.address);
    console.log('Cidade:', row.city);
    console.log('Estado:', row.state);
    console.log('CEP:', row.zipCode);
    console.log('Status:', row.status);
    console.log('Plano:', row.plan);
    console.log('Status do Plano:', row.planStatus);
    console.log('Chave PIX:', row.pixKey);
    console.log('Tipo de Chave PIX:', row.pixKeyType);
    console.log('Nome do Beneficiário:', row.merchantName);
    console.log('Cidade do Beneficiário:', row.merchantCity);
    console.log('Wellhub API Key:', row.wellhubApiKey);
    console.log('Wellhub Webhook Secret:', row.wellhubWebhookSecret);
    console.log('Razão de Bloqueio:', row.blockedReason);
    console.log('Criado em:', row.createdAt);
    console.log('Atualizado em:', row.updatedAt);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  await connection.end();
}

checkDatabase().catch(console.error);
