// Test script to check payment + student data structure
import mysql from 'mysql2/promise';

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'academia',
    password: 'Academia2026Secure',
    database: 'academia_db'
  });

  console.log('🔍 Testing payment with student data...\n');

  // Get a recent payment
  const [payments] = await conn.execute(
    'SELECT * FROM payments WHERE gymId = 1 ORDER BY createdAt DESC LIMIT 1'
  );

  if (payments.length === 0) {
    console.log('❌ No payments found');
    await conn.end();
    return;
  }

  const payment = payments[0];
  console.log('💰 Payment found:');
  console.log('   ID:', payment.id);
  console.log('   StudentID:', payment.studentId);
  console.log('   Amount:', payment.amountInCents / 100);
  console.log('   Status:', payment.status);

  // Get the student
  const [students] = await conn.execute(
    'SELECT * FROM students WHERE id = ? AND gymId = 1',
    [payment.studentId]
  );

  if (students.length === 0) {
    console.log('\n❌ Student NOT found for studentId:', payment.studentId);
  } else {
    const student = students[0];
    console.log('\n✅ Student found:');
    console.log('   ID:', student.id);
    console.log('   Name:', student.name);
    console.log('   Email:', student.email);
    console.log('   Registration:', student.registrationNumber);

    // Test the join
    const result = {
      ...payment,
      student: student
    };

    console.log('\n📦 Combined result structure:');
    console.log(JSON.stringify(result, null, 2));
  }

  await conn.end();
  console.log('\n✅ Test completed');
}

test().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
