/**
 * Envia emails de credenciais e confirmação de pagamento para academia
 */
import { sendGymAdminCredentials, sendGymPaymentConfirmedEmail } from './dist/index.js';

const email = 'contato@giralditelecom.com.br';
const password = 'Sc!rzPoaHbx7';
const gymName = 'teste';
const gymSlug = 'teste';
const plan = 'enterprise';

console.log('\n========================================');
console.log('  ENVIO DE EMAILS - ACADEMIA');
console.log('========================================\n');

console.log(`📧 Enviando emails para: ${email}\n`);

try {
  // Email 1: Credenciais de acesso
  console.log('📨 1. Enviando credenciais de acesso...');
  await sendGymAdminCredentials(email, password, gymName, gymSlug, plan);
  console.log('✅ Credenciais enviadas!\n');

  // Email 2: Confirmação de pagamento
  console.log('📨 2. Enviando confirmação de pagamento...');
  await sendGymPaymentConfirmedEmail(email, gymName, gymSlug, plan);
  console.log('✅ Confirmação enviada!\n');

  console.log('========================================');
  console.log('✅ TODOS OS EMAILS FORAM ENVIADOS!');
  console.log('========================================\n');

} catch (error) {
  console.error('❌ Erro ao enviar emails:', error.message);
  console.error(error);
  process.exit(1);
}
