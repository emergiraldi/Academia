# Deploy Screenshots Management System to VPS
$env:TERM = "xterm"

Write-Host "🚀 Iniciando deploy do sistema de screenshots..." -ForegroundColor Cyan
Write-Host ""

# Execute deploy via SSH
ssh -o StrictHostKeyChecking=no root@72.60.2.237 @"
cd /var/www/academia
echo '📥 1. Atualizando código do GitHub...'
git pull origin main
echo ''
echo '🔧 2. Criando tabela de screenshots...'
node create_landing_screenshots_table.js
echo ''
echo '🏗️  3. Compilando projeto...'
npm run build
echo ''
echo '🔄 4. Reiniciando PM2...'
pm2 restart academia-api
echo ''
echo '⏳ 5. Aguardando backend iniciar...'
sleep 3
echo ''
echo '📋 6. Últimos logs do PM2:'
pm2 logs academia-api --lines 20 --nostream
echo ''
echo '📊 7. Status do PM2:'
pm2 status
echo ''
echo '========================================'
echo '✅ Deploy concluído com sucesso!'
echo '========================================'
echo ''
echo '🌐 Site: https://www.sysfitpro.com.br'
echo '📸 Screenshots: https://www.sysfitpro.com.br/super-admin/screenshots'
"@
