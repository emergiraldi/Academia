# Deploy Fix for Screenshots Schema Error
$env:TERM = "xterm"

Write-Host "🚀 Fazendo deploy da correção..." -ForegroundColor Cyan
Write-Host ""

# Execute deploy via SSH
ssh -o StrictHostKeyChecking=no root@72.60.2.237 @"
cd /var/www/academia
echo '📥 1. Atualizando código...'
git pull origin main
echo ''
echo '🏗️  2. Compilando...'
npm run build
echo ''
echo '🔄 3. Reiniciando PM2...'
pm2 restart academia-api
echo ''
echo '⏳ 4. Aguardando...'
sleep 3
echo ''
echo '========================================'
echo '✅ Deploy concluído!'
echo '========================================'
echo ''
echo '🌐 Teste em: https://www.sysfitpro.com.br/super-admin/screenshots'
"@
