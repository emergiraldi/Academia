# Deploy Backend de Mensalidades
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Deploy Backend de Mensalidades" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$server = "root@138.197.8.136"

Write-Host "📥 1. Atualizando código do GitHub..." -ForegroundColor Yellow
ssh $server "cd /var/www/academia && git pull origin main"

Write-Host ""
Write-Host "🏗️  2. Compilando projeto..." -ForegroundColor Yellow
ssh $server "cd /var/www/academia && npm run build"

Write-Host ""
Write-Host "🔄 3. Reiniciando PM2..." -ForegroundColor Yellow
ssh $server "cd /var/www/academia && pm2 restart academia-api"

Write-Host ""
Write-Host "⏳ 4. Aguardando backend iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "📋 5. Últimos logs do PM2:" -ForegroundColor Yellow
ssh $server "pm2 logs academia-api --lines 20 --nostream"

Write-Host ""
Write-Host "📊 6. Status do PM2:" -ForegroundColor Yellow
ssh $server "pm2 status"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Site: https://www.sysfitpro.com.br" -ForegroundColor Cyan
