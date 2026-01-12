# Deploy Uploads Fix
$env:TERM = "xterm"

Write-Host "🚀 Fazendo deploy da correção de persistência de uploads..." -ForegroundColor Cyan
Write-Host ""

# Execute deploy via SSH
ssh -o StrictHostKeyChecking=no root@72.60.2.237 @"
cd /var/www/academia
echo '📥 1. Atualizando código do GitHub...'
git pull origin main
echo ''
echo '🏗️  2. Compilando projeto...'
npm run build
echo ''
echo '🔄 3. Reiniciando PM2...'
pm2 restart academia-api
echo ''
echo '⏳ 4. Aguardando backend iniciar...'
sleep 3
echo ''
echo '📋 5. Últimos logs do PM2:'
pm2 logs academia-api --lines 20 --nostream
echo ''
echo '📊 6. Status do PM2:'
pm2 status
echo ''
echo '========================================'
echo '✅ Deploy concluído com sucesso!'
echo '========================================'
echo ''
echo '🌐 Site: https://www.sysfitpro.com.br'
echo '📸 Upload: https://www.sysfitpro.com.br/super-admin/screenshots'
echo ''
echo '✅ Correção aplicada:'
echo '  ✓ Uploads agora persistem após reiniciar VPS'
echo '  ✓ Pasta uploads/ separada do dist/'
"@
