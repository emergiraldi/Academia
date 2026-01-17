# Deploy rápido - Fix Settings Validation
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "     DEPLOY - Fix Validação Settings" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

ssh root@72.60.2.237 "cd /var/www/academia && pm2 restart academia-api && echo '' && echo '✅ Serviço reiniciado!' && pm2 logs academia-api --nostream --lines 15"

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "     Deploy concluído!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
pause
