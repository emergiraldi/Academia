const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  // Buscar studentId e subscriptionId
  const [students] = await conn.execute('SELECT id FROM students WHERE userId = 1985 LIMIT 1');
  const studentId = students[0].id;

  const [subs] = await conn.execute('SELECT id FROM subscriptions WHERE studentId = ? LIMIT 1', [studentId]);
  const subscriptionId = subs[0]?.id || null;

  console.log('Criando pagamentos de teste...');
  console.log('studentId:', studentId);
  console.log('subscriptionId:', subscriptionId);

  // Criar pagamento futuro (pendente - não atrasado)
  await conn.execute(`
    INSERT INTO payments (studentId, subscriptionId, amountInCents, dueDate, status, gymId, createdAt, updatedAt)
    VALUES (?, ?, 14999, '2025-12-25', 'pending', 1, NOW(), NOW())
  `, [studentId, subscriptionId]);
  console.log('✅ Pagamento futuro criado: R$ 149,99 - Vencimento: 25/12/2025');

  // Criar pagamento pago
  await conn.execute(`
    INSERT INTO payments (studentId, subscriptionId, amountInCents, dueDate, status, gymId, createdAt, updatedAt)
    VALUES (?, ?, 14999, '2025-11-18', 'paid', 1, NOW(), NOW())
  `, [studentId, subscriptionId]);
  console.log('✅ Pagamento pago criado: R$ 149,99 - Vencimento: 18/11/2025 (PAGO)');

  await conn.end();
  console.log('\n✅ Pagamentos criados com sucesso!');
})().catch(console.error);
