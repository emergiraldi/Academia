import mysql from 'mysql2/promise';

/**
 * Adiciona campo payment_method na tabela gym_billing_cycles
 * para registrar a forma de pagamento quando o super admin der baixa manual
 */

async function addPaymentMethodColumn() {
  let conn;

  try {
    console.log('🔌 Conectando ao banco de dados...');

    conn = await mysql.createConnection({
      host: '72.60.2.237',
      user: 'academia',
      password: 'Academia2026Secure',
      database: 'academia_db'
    });

    console.log('✅ Conectado com sucesso!');
    console.log('');

    // Verificar se a coluna já existe
    const [columns] = await conn.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'academia_db'
      AND TABLE_NAME = 'gym_billing_cycles'
      AND COLUMN_NAME = 'payment_method'
    `);

    if (columns.length > 0) {
      console.log('ℹ️  Coluna payment_method já existe na tabela gym_billing_cycles');
      return;
    }

    console.log('📝 Adicionando coluna payment_method...');

    // Adicionar coluna payment_method após paidAt
    await conn.execute(`
      ALTER TABLE gym_billing_cycles
      ADD COLUMN payment_method VARCHAR(50) NULL
      COMMENT 'Forma de pagamento: PIX, Boleto, Transferência, Dinheiro, Cartão, etc.'
      AFTER paid_at
    `);

    console.log('✅ Coluna payment_method adicionada com sucesso!');
    console.log('');
    console.log('📊 Estrutura atualizada:');
    console.log('   - Campo: payment_method');
    console.log('   - Tipo: VARCHAR(50)');
    console.log('   - Null: SIM (opcional)');
    console.log('   - Valores: PIX, Boleto, Transferência, Dinheiro, Cartão, etc.');

  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
      console.log('');
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar
addPaymentMethodColumn()
  .then(() => {
    console.log('');
    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });
