# Upload and run screenshot table creation script

Write-Host "🚀 Criando tabela landing_page_screenshots no VPS..." -ForegroundColor Cyan
Write-Host ""

# Copy file to VPS
Write-Host "📤 1. Enviando script para VPS..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no create_landing_screenshots_table_v2.js root@72.60.2.237:/var/www/academia/

Write-Host ""
Write-Host "🔧 2. Executando script no VPS..." -ForegroundColor Yellow

# Execute script on VPS
ssh -o StrictHostKeyChecking=no root@72.60.2.237 "cd /var/www/academia && node create_landing_screenshots_table_v2.js"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Processo concluído!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Acesse: https://www.sysfitpro.com.br/super-admin/screenshots" -ForegroundColor Cyan
