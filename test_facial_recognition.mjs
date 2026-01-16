import mysql from 'mysql2/promise';

console.log('🧪 TESTE DE RECONHECIMENTO FACIAL SIMULADO\n');

// Configuração do banco de dados
const connection = await mysql.createConnection({
  host: '72.60.2.237',
  user: 'academia',
  password: 'Academia2026Secure',
  database: 'academia_db'
});

try {
  // Dados do teste
  const gymId = 33;
  const studentId = 7; // Alexandre Nuggueth
  const deviceId = 3;
  const accessType = 'exit'; // Pode ser 'entry' ou 'exit'

  // Criar timestamp ÚNICO (agora + alguns segundos para garantir que não é duplicata)
  const now = new Date();
  now.setSeconds(now.getSeconds() + 5); // 5 segundos no futuro
  const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

  console.log(`📊 Inserindo log de teste:`);
  console.log(`   - Academia: ${gymId}`);
  console.log(`   - Aluno: ${studentId}`);
  console.log(`   - Dispositivo: ${deviceId}`);
  console.log(`   - Tipo: ${accessType}`);
  console.log(`   - Timestamp: ${timestamp}`);
  console.log('');

  // Inserir log simulado
  const [result] = await connection.execute(
    `INSERT INTO access_logs
    (gymId, studentId, deviceId, deviceType, accessType, timestamp)
    VALUES (?, ?, ?, 'control_id', ?, ?)`,
    [gymId, studentId, deviceId, accessType, timestamp]
  );

  console.log(`✅ Log inserido com sucesso! ID: ${result.insertId}`);
  console.log('');
  console.log('⏳ Aguardando CRON processar (máximo 30 segundos)...');
  console.log('');
  console.log('👁️  AGORA: Verifique se a catraca foi liberada automaticamente!');
  console.log('');
  console.log('💡 Dica: Monitore os logs do servidor com:');
  console.log('   ssh root@72.60.2.237 "pm2 logs academia-api --lines 50"');

} catch (error) {
  console.error('❌ Erro:', error.message);
  if (error.code === 'ER_DUP_ENTRY') {
    console.log('');
    console.log('⚠️  Este log já existe no banco. Tente novamente em alguns segundos.');
  }
} finally {
  await connection.end();
}
