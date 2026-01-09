/**
 * Simula webhook do PIX para processar pagamento
 */
import { processPixWebhook } from './dist/index.js';

const txid = 'J8B1CVTAOI88D9994M4H5O5D68C9GDHA';

// Payload simulando notificação do Sicoob
const payload = {
  pix: [{
    txid: txid,
    endToEndId: 'E1234567890202601091411XXXXXXXX',
    valor: '1.00',
    horario: new Date().toISOString()
  }]
};

console.log('\n========================================');
console.log('  SIMULANDO WEBHOOK DO PIX');
console.log('========================================\n');

console.log('📨 Processando pagamento via webhook...\n');
console.log('TxID:', txid);
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('');

try {
  const result = await processPixWebhook(payload);
  console.log('\n✅ Resultado:', JSON.stringify(result, null, 2));
  console.log('\n========================================');
  console.log('✅ WEBHOOK PROCESSADO COM SUCESSO!');
  console.log('========================================\n');
} catch (error) {
  console.error('\n❌ Erro ao processar webhook:', error.message);
  console.error(error);
  process.exit(1);
}
