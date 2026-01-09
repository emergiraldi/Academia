$ip = "72.60.2.237"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ENVIO DE EMAILS - ACADEMIA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conectando ao servidor $ip..." -ForegroundColor Yellow
Write-Host ""

# Create and run email script on server
ssh -o StrictHostKeyChecking=no root@$ip @"
cd /var/www/academia
cat > send_emails_now.mjs <<'EMAILSCRIPT'
import { sendGymAdminCredentials, sendGymPaymentConfirmedEmail } from './dist/index.js';

const email = 'contato@giralditelecom.com.br';
const password = 'Sc!rzPoaHbx7';
const gymName = 'teste';
const gymSlug = 'teste';
const plan = 'enterprise';

console.log('\n📨 1. Enviando credenciais de acesso...');
try {
  await sendGymAdminCredentials(email, password, gymName, gymSlug, plan);
  console.log('✅ Credenciais enviadas!\n');
} catch (error) {
  console.error('❌ Erro ao enviar credenciais:', error.message);
}

console.log('📨 2. Enviando confirmação de pagamento...');
try {
  await sendGymPaymentConfirmedEmail(email, gymName, gymSlug, plan);
  console.log('✅ Confirmação enviada!\n');
} catch (error) {
  console.error('❌ Erro ao enviar confirmação:', error.message);
}

console.log('========================================');
console.log('✅ PROCESSO DE ENVIO CONCLUÍDO!');
console.log('========================================\n');
EMAILSCRIPT

echo "Executando script de envio de emails..."
node send_emails_now.mjs
rm send_emails_now.mjs
"@

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
