import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkTableStructure() {
  try {
    const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
    const match = dbUrl.match(/mysql:\/\/([^:]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('DATABASE_URL inválida');
    }

    const [, user, password, host, port, database] = match;

    const connection = await mysql.createConnection({
      host,
      user,
      password: password || '',
      database,
    });

    console.log('✅ Conectado ao banco de dados\n');

    // Check class_bookings structure
    console.log('📋 Estrutura da tabela class_bookings:');
    console.log('=====================================');
    const [columns] = await connection.query('DESCRIBE class_bookings');
    console.table(columns);

    console.log('\n📋 Estrutura da tabela class_schedules:');
    console.log('========================================');
    const [scheduleColumns] = await connection.query('DESCRIBE class_schedules');
    console.table(scheduleColumns);

    console.log('\n📋 Estrutura da tabela visitor_bookings:');
    console.log('=========================================');
    const [visitorColumns] = await connection.query('DESCRIBE visitor_bookings');
    console.table(visitorColumns);

    console.log('\n📋 Estrutura da tabela payment_methods:');
    console.log('========================================');
    const [paymentColumns] = await connection.query('DESCRIBE payment_methods');
    console.table(paymentColumns);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkTableStructure();
