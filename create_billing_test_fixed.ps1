$password = "935559Emerson@"
$ip = "138.197.8.136"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Criando Mensalidade de Teste" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Criar script expect temporário
$expectScript = @"
#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@$ip
expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "$ " {
        send "cd /var/www/academia\r"
        expect "$ "
        send "echo '📥 1. Atualizando código do GitHub...'\r"
        expect "$ "
        send "git pull origin main\r"
        expect "$ "
        send "echo ''\r"
        expect "$ "
        send "echo '🏗️  2. Criando mensalidade de teste...'\r"
        expect "$ "
        send "node create_test_billing_cycle.js\r"
        expect "$ "
        send "exit\r"
    }
}
expect eof
"@

# Salvar script expect
$expectFile = "C:\Projeto\Academia\create_billing_expect.sh"
$expectScript | Out-File -FilePath $expectFile -Encoding ASCII -NoNewline

try {
    Write-Host "Conectando ao servidor $ip..." -ForegroundColor Yellow
    Write-Host ""

    # Executar via WSL
    wsl bash -c "expect $expectFile 2>&1"

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Concluído!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acesse: https://www.sysfitpro.com.br/admin/billing" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao executar:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Execute manualmente:" -ForegroundColor Yellow
    Write-Host "ssh root@$ip" -ForegroundColor White
    Write-Host "Senha: $password" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Depois execute:" -ForegroundColor Cyan
    Write-Host "cd /var/www/academia" -ForegroundColor White
    Write-Host "git pull origin main" -ForegroundColor White
    Write-Host "node create_test_billing_cycle.js" -ForegroundColor White
}

# Limpar arquivo temporário
Remove-Item $expectFile -ErrorAction SilentlyContinue
