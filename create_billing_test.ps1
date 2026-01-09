# Script para criar mensalidade de teste
Write-Host "========================================"
Write-Host "  Criando Mensalidade de Teste"
Write-Host "========================================"
Write-Host ""

Write-Host "1. Atualizando codigo do GitHub..." -ForegroundColor Yellow
ssh root@72.60.2.237 'cd /var/www/academia && git pull origin main'

Write-Host ""
Write-Host "2. Criando mensalidade de teste..." -ForegroundColor Yellow
ssh root@72.60.2.237 'cd /var/www/academia && node create_test_billing_cycle.js'

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Concluido!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Acesse: https://www.sysfitpro.com.br/admin/billing" -ForegroundColor Cyan
