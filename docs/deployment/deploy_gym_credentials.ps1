# Deploy do sistema de credenciais automáticas para academias
Write-Host "🚀 Iniciando deploy do sistema de credenciais automáticas..." -ForegroundColor Cyan

# Configuração SSH
$sshHost = "root@72.60.2.237"
$remotePath = "/var/www/academia"

Write-Host "`n📥 1. Atualizando código do GitHub..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $sshHost "cd $remotePath; git pull origin main"

Write-Host "`n🔧 2. Executando migração de credenciais temporárias..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $sshHost "cd $remotePath; node add_gym_temp_credentials.js"

Write-Host "`n🏗️  3. Compilando projeto..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $sshHost "cd $remotePath; npm run build"

Write-Host "`n🔄 4. Reiniciando PM2..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $sshHost "cd $remotePath; pm2 restart academia-api"

Write-Host "`n⏳ 5. Aguardando backend iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n📋 6. Últimos logs do PM2:" -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $sshHost "cd $remotePath; pm2 logs academia-api --lines 20 --nostream"

Write-Host "`n📊 7. Status do PM2:" -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $sshHost "cd $remotePath; pm2 status"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n🌐 Site: https://www.sysfitpro.com.br" -ForegroundColor Cyan
