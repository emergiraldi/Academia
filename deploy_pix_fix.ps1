$password = "935559Emerson@"
$ip = "72.60.2.237"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy: Correção Método PIX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try using plink if available (PuTTY)
$plinkPath = "plink.exe"
if (Get-Command $plinkPath -ErrorAction SilentlyContinue) {
    Write-Host "🚀 Usando PuTTY plink para deploy..." -ForegroundColor Yellow
    echo y | & $plinkPath -ssh -pw $password root@$ip "cd /var/www/academia && echo '📥 1. Atualizando código...' && git pull origin main && echo '' && echo '🏗️  2. Compilando...' && npm run build && echo '' && echo '🔄 3. Reiniciando...' && pm2 restart academia-api && echo '' && echo '✅ Deploy concluído!' && echo '' && pm2 logs academia-api --lines 20 --nostream"
}
else {
    Write-Host "❌ plink não encontrado. Usando ssh nativo..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Conectando ao servidor..." -ForegroundColor Gray
    Write-Host ""

    # Use ssh directly (will prompt for password)
    ssh -o StrictHostKeyChecking=no root@$ip "cd /var/www/academia && echo '📥 1. Atualizando código...' && git pull origin main && echo '' && echo '🏗️  2. Compilando...' && npm run build && echo '' && echo '🔄 3. Reiniciando...' && pm2 restart academia-api && echo '' && echo '⏳ Aguardando...' && sleep 3 && echo '' && echo '✅ Deploy concluído!' && echo '' && pm2 logs academia-api --lines 20 --nostream && echo '' && echo '🌐 Teste em: https://www.sysfitpro.com.br/admin/billing'"
}
