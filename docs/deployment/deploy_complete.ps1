# Deploy Completo (Screenshots + QRCode + Webhook Fix)
$env:TERM = "xterm"

Write-Host "🚀 Fazendo deploy completo..." -ForegroundColor Cyan
Write-Host ""

# Execute deploy via SSH
ssh -o StrictHostKeyChecking=no root@72.60.2.237 @"
cd /var/www/academia
echo '📥 1. Atualizando código do GitHub...'
git pull origin main
echo ''
echo '🔧 2. Instalando dependências...'
npm install --legacy-peer-deps
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
echo '📸 Upload de imagens: https://www.sysfitpro.com.br/super-admin/screenshots'
echo '💰 Mensalidades: https://www.sysfitpro.com.br/admin/billing'
echo ''
echo '✨ Correções aplicadas:'
echo '  ✓ Dependência qrcode adicionada'
echo '  ✓ Upload de imagens para screenshots'
echo '  ✓ Webhook PIX corrigido para mensalidades'
"@
