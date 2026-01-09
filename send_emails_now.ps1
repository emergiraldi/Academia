$ip = "72.60.2.237"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ENVIANDO EMAILS - ACADEMIA TESTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Copiar script para o servidor
Write-Host "📤 Copiando script para o servidor..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no send_emails_direct.js root@${ip}:/var/www/academia/

# Executar script no servidor
Write-Host "📧 Enviando emails..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no root@$ip "cd /var/www/academia && node send_emails_direct.js"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ PROCESSO CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
