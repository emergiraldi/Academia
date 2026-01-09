$password = "935559Emerson@"
$ip = "72.60.2.237"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy com Mensalidade de Teste" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Servidor: $ip" -ForegroundColor Gray
Write-Host "Senha: $password" -ForegroundColor Gray
Write-Host ""
Write-Host "COMANDOS PARA EXECUTAR NO SERVIDOR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "cd /var/www/academia" -ForegroundColor White
Write-Host "git pull origin main" -ForegroundColor White
Write-Host "node create_test_billing_cycle.js" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tentar abrir sessão SSH (vai pedir senha manualmente)
& ssh root@$ip
