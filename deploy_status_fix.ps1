# Deploy script - Fix PIX status recognition
# Atualiza webhook para aceitar status "Liquidado" além de "paid"

Write-Host "🚀 Iniciando deploy da correção de status PIX..." -ForegroundColor Cyan
Write-Host ""

# Commit local changes
Write-Host "📝 Commitando alterações locais..." -ForegroundColor Yellow
git add server/pixWebhook.ts
git commit -m "fix: Adiciona suporte para múltiplos status de pagamento (Liquidado, QUITADO, etc)"
git push origin main

Write-Host ""
Write-Host "✅ Código enviado para GitHub!" -ForegroundColor Green
Write-Host ""

# SSH usando plink (PuTTY) se disponível, ou ssh nativo do Git Bash
Write-Host "🔄 Conectando ao servidor..." -ForegroundColor Yellow

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
echo '🌐 Site: https://www.sysfitpro.com.br' &&
echo '💡 O webhook agora aceita status: Liquidado, QUITADO, PAGO, CONCLUIDA'
"@

# Tenta usar ssh do Git Bash
& "C:\Program Files\Git\usr\bin\ssh.exe" -o StrictHostKeyChecking=no root@138.197.8.136 $sshCommand

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Agora o webhook PIX aceita os seguintes status como 'pago':" -ForegroundColor Cyan
Write-Host "  - paid / PAID" -ForegroundColor White
Write-Host "  - pago / PAGO" -ForegroundColor White
Write-Host "  - liquidado / LIQUIDADO / Liquidado" -ForegroundColor White
Write-Host "  - quitado / QUITADO" -ForegroundColor White
Write-Host "  - concluida / CONCLUIDA" -ForegroundColor White
