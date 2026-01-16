#!/usr/bin/env node
/**
 * Script para listar IDs de todas as academias
 * Útil para configurar o AGENT_ID correto em cada cliente
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

async function main() {
  console.log('🏢 Listando academias cadastradas...\n');

  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'academia',
    password: 'Academia2026Secure',
    database: 'academia_db'
  });

  const [gyms] = await conn.execute(`
    SELECT
      id,
      slug,
      name,
      createdAt
    FROM gyms
    ORDER BY id
  `);

  console.log('┌──────┬────────────────────────────┬─────────────────┬─────────────────────┐');
  console.log('│  ID  │ Nome                       │ Slug            │ Cadastro            │');
  console.log('├──────┼────────────────────────────┼─────────────────┼─────────────────────┤');

  for (const gym of gyms) {
    const id = String(gym.id).padEnd(4);
    const name = String(gym.name).substring(0, 26).padEnd(26);
    const slug = String(gym.slug).substring(0, 15).padEnd(15);
    const date = new Date(gym.createdAt).toLocaleDateString('pt-BR');

    console.log(`│ ${id} │ ${name} │ ${slug} │ ${date}        │`);
  }

  console.log('└──────┴────────────────────────────┴─────────────────┴─────────────────────┘');
  console.log(`\nTotal: ${gyms.length} academia(s)\n`);

  console.log('📝 IMPORTANTE:');
  console.log('   Cada academia precisa do seu AGENT_ID único!');
  console.log('   Exemplo: Se a academia tem ID 33, use: AGENT_ID=academia-33\n');

  await conn.end();
}

main().catch(console.error);
