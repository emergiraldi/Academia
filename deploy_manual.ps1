# Deploy Manual - Sistema de Planos SaaS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY - SISTEMA DE PLANOS SAAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$password = "935559Emerson@"
$ip = "138.197.8.136"

Write-Host "📋 Instruções de Deploy:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conecte ao servidor via SSH:" -ForegroundColor White
Write-Host "   ssh root@$ip" -ForegroundColor Green
Write-Host ""
Write-Host "2. Quando solicitar a senha, digite:" -ForegroundColor White
Write-Host "   $password" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Execute os seguintes comandos:" -ForegroundColor White
Write-Host ""
Write-Host "   cd /var/www/academia" -ForegroundColor Green
Write-Host "   git pull origin main" -ForegroundColor Green
Write-Host "   npm run build" -ForegroundColor Green
Write-Host "   pm2 restart academia-api" -ForegroundColor Green
Write-Host "   pm2 logs academia-api --lines 20 --nostream" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "4. Verifique se está tudo OK no site:" -ForegroundColor White
Write-Host "   https://www.sysfitpro.com.br" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tentar abrir o terminal SSH automaticamente
$startSSH = Read-Host "Deseja abrir o terminal SSH agora? (S/N)"
if ($startSSH -eq "S" -or $startSSH -eq "s") {
    Start-Process "cmd.exe" -ArgumentList "/k", "ssh root@$ip"
}
