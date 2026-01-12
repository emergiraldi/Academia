# Deploy do Dashboard Financeiro para VPS
# Este script faz deploy das alterações do sistema de relatórios financeiros

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy do Dashboard Financeiro" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Conectar via SSH e executar comandos
$sshCommand = @"
cd /var/www/academia &&
echo '📥 1. Atualizando código do GitHub...' &&
git pull origin main &&
echo '' &&
echo '🏗️  2. Compilando projeto...' &&
npm run build &&
echo '' &&
echo '🔄 3. Reiniciando PM2...' &&
pm2 restart academia-api &&
echo '' &&
echo '⏳ 4. Aguardando backend iniciar...' &&
sleep 3 &&
echo '' &&
echo '📋 5. Últimos logs do PM2:' &&
pm2 logs academia-api --lines 20 --nostream &&
echo '' &&
echo '📊 6. Status do PM2:' &&
pm2 status &&
echo '' &&
echo '========================================' &&
echo '✅ Deploy concluído com sucesso!' &&
echo '========================================' &&
echo '' &&
echo '🌐 Acesse o Super Admin em: https://www.sysfitpro.com.br/super-admin' &&
echo '   Dashboard financeiro disponível!'
"@

Write-Host "Conectando ao servidor..." -ForegroundColor Yellow
ssh root@72.60.2.237 $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Deploy concluído!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Erro no deploy!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}
