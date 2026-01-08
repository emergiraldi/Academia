# Deploy Database to VPS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy Completo do Banco de Dados" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backupFile = "academia_db_backup.sql"
$vpsHost = "72.60.2.237"
$vpsUser = "root"
$vpsPassword = "935559Emerson@"
$vpsPath = "/var/www/academia"

# Check if backup exists
if (-not (Test-Path $backupFile)) {
    Write-Host "❌ Arquivo de backup não encontrado!" -ForegroundColor Red
    Write-Host "💡 Execute primeiro: node export_database.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "📊 Arquivo de backup encontrado" -ForegroundColor Green
$fileSize = (Get-Item $backupFile).Length / 1MB
Write-Host "   Tamanho: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
Write-Host ""

# Step 1: Upload using SCP (will prompt for password)
Write-Host "📤 1. Fazendo upload do backup para VPS..." -ForegroundColor Yellow
Write-Host "   Digite a senha quando solicitado: $vpsPassword" -ForegroundColor Gray
Write-Host ""

$scpArgs = "-o StrictHostKeyChecking=no $backupFile ${vpsUser}@${vpsHost}:${vpsPath}/"
Start-Process -FilePath "scp" -ArgumentList $scpArgs -NoNewWindow -Wait

Write-Host ""
Write-Host "✅ Upload concluído!" -ForegroundColor Green
Write-Host ""

# Step 2: Execute restoration via SSH
Write-Host "🔄 2. Executando restauração na VPS..." -ForegroundColor Yellow
Write-Host "   Digite a senha quando solicitado: $vpsPassword" -ForegroundColor Gray
Write-Host ""

$sshCommands = @"
cd /var/www/academia && \
echo '📥 Atualizando código do GitHub...' && \
git pull origin main && \
echo '' && \
echo '🗄️  Dropando banco existente...' && \
mysql -u root -e 'DROP DATABASE IF EXISTS academia_db;' && \
echo '✓ Banco removido' && \
echo '' && \
echo '📦 Restaurando backup...' && \
mysql -u root < academia_db_backup.sql && \
echo '✓ Backup restaurado' && \
echo '' && \
echo '🧹 Removendo arquivo de backup...' && \
rm academia_db_backup.sql && \
echo '✓ Arquivo removido' && \
echo '' && \
echo '🏗️  Compilando projeto...' && \
npm run build && \
echo '' && \
echo '🔄 Reiniciando PM2...' && \
pm2 restart academia-api && \
echo '' && \
echo '⏳ Aguardando 3 segundos...' && \
sleep 3 && \
echo '' && \
echo '📋 Logs do PM2:' && \
pm2 logs academia-api --lines 30 --nostream && \
echo '' && \
echo '📊 Status do PM2:' && \
pm2 status && \
echo '' && \
echo '========================================' && \
echo '✅ Restauração concluída com sucesso!' && \
echo '========================================' && \
echo '' && \
echo '🌐 Site: https://www.sysfitpro.com.br'
"@

$sshArgs = "-o StrictHostKeyChecking=no ${vpsUser}@${vpsHost} `"$sshCommands`""
Start-Process -FilePath "ssh" -ArgumentList $sshArgs -NoNewWindow -Wait

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deploy finalizado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Acesse: https://www.sysfitpro.com.br" -ForegroundColor Cyan
