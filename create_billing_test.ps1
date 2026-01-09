# Script para criar mensalidade de teste
$password = "935559Emerson@"
$ip = "72.60.2.237"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Criando Mensalidade de Teste" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Servidor: $ip" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "1. Conectando e atualizando codigo..." -ForegroundColor Yellow

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
    "] " {
        send "cd /var/www/academia && git pull origin main && node create_test_billing_cycle.js && exit\r"
    }
}
expect eof
"@

    $expectFile = [System.IO.Path]::GetTempFileName() + ".sh"
    $expectScript | Out-File -FilePath $expectFile -Encoding ASCII -NoNewline

    wsl bash -c "expect $expectFile 2>&1"
    Remove-Item $expectFile -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Concluido!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acesse: https://www.sysfitpro.com.br/admin/billing" -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar via expect" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute manualmente:" -ForegroundColor Yellow
    Write-Host "ssh root@$ip" -ForegroundColor White
    Write-Host "Senha: $password" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Depois execute:" -ForegroundColor Cyan
    Write-Host "cd /var/www/academia" -ForegroundColor White
    Write-Host "git pull origin main" -ForegroundColor White
    Write-Host "node create_test_billing_cycle.js" -ForegroundColor White
}
