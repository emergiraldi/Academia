$password = "935559Emerson@"
$ip = "72.60.2.237"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy: Correção PIX e Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create expect script for SSH automation
$expectScript = @"
#!/usr/bin/expect -f
set timeout -1
spawn ssh -o StrictHostKeyChecking=no root@$ip
expect "password:"
send "$password\r"
expect "# "
send "cd /var/www/academia && echo '📥 1. Atualizando código do GitHub...' && git pull origin main && echo '' && echo '🏗️  2. Compilando projeto...' && npm run build && echo '' && echo '🔄 3. Reiniciando PM2...' && pm2 restart academia-api && echo '' && echo '⏳ 4. Aguardando backend iniciar...' && sleep 3 && echo '' && echo '🏗️  5. Criando mensalidade de teste...' && node create_test_billing_cycle.js && echo '' && echo '📊 6. Status do PM2:' && pm2 status && echo '' && echo '========================================' && echo '✅ Deploy concluído com sucesso!' && echo '========================================' && echo '' && echo '🌐 Site: https://www.sysfitpro.com.br/admin/billing'\r"
expect "# "
send "exit\r"
expect eof
"@

# Save expect script to temp file
$expectScript | Out-File -FilePath "deploy_temp.exp" -Encoding ASCII

# Run expect script
try {
    if (Get-Command wsl -ErrorAction SilentlyContinue) {
        Write-Host "🚀 Executando deploy via WSL..." -ForegroundColor Yellow
        wsl bash -c "expect deploy_temp.exp"
    } else {
        Write-Host "❌ WSL não encontrado" -ForegroundColor Red
        Write-Host ""
        Write-Host "Execute manualmente:" -ForegroundColor Yellow
        Write-Host "ssh root@$ip" -ForegroundColor White
        Write-Host "Senha: $password" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Depois execute:" -ForegroundColor Yellow
        Write-Host "cd /var/www/academia" -ForegroundColor White
        Write-Host "git pull origin main" -ForegroundColor White
        Write-Host "npm run build" -ForegroundColor White
        Write-Host "pm2 restart academia-api" -ForegroundColor White
        Write-Host "node create_test_billing_cycle.js" -ForegroundColor White
    }
} finally {
    # Clean up temp file
    if (Test-Path "deploy_temp.exp") {
        Remove-Item "deploy_temp.exp" -Force
    }
}
