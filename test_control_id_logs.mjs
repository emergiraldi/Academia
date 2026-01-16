import 'dotenv/config';

console.log('🔍 Testando busca de logs do Control ID...\n');

const AGENT_WS_URL = 'http://localhost:3001';

try {
  const response = await fetch(`${AGENT_WS_URL}/api/control-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gymIdentifier: 'academia-33',
      command: 'loadAccessLogs',
      params: {}
    })
  });

  const data = await response.json();

  console.log('✅ Resposta do Agent:');
  console.log(JSON.stringify(data, null, 2));

  if (data.success && data.result) {
    const logs = data.result;
    console.log(`\n📊 Total de logs retornados: ${logs.length}`);

    if (logs.length > 0) {
      console.log('\n🕐 Logs mais recentes (últimos 5):');
      logs.slice(-5).forEach(log => {
        console.log(`  - user_id=${log.user_id}, event=${log.event}, time=${log.time}`);
      });

      const lastLog = logs[logs.length - 1];
      console.log(`\n⏰ Último log: ${lastLog.time}`);
      console.log(`⏰ Hora atual: ${new Date().toLocaleString('pt-BR')}`);
    }
  }
} catch (error) {
  console.error('❌ Erro:', error.message);
}
