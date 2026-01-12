$ip = "72.60.2.237"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY - FIX CPF/CNPJ PIX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conectando ao servidor $ip..." -ForegroundColor Yellow
Write-Host ""

# Comandos a serem executados no servidor
$commands = @"
cd /var/www/academia
echo '📥 1. Atualizando código do GitHub...'
git pull origin main
echo ''
echo '🏗️  2. Compilando projeto...'
npm run build
echo ''
echo '🔄 3. Reiniciando PM2...'
pm2 restart academia-api
echo ''
echo '⏳ 4. Aguardando backend iniciar...'
sleep 3
echo ''
echo '📋 5. Últimos logs do PM2:'
pm2 logs academia-api --lines 30 --nostream
echo ''
echo '📊 6. Status do PM2:'
pm2 status
echo ''
echo '========================================'
echo '✅ Deploy concluído com sucesso!'
echo '========================================'
echo ''
echo '🌐 Teste agora criando uma nova academia:'
echo 'https://www.sysfitpro.com.br'
"@

try {
    # Conectar via SSH e executar comandos
    ssh -o StrictHostKeyChecking=no root@$ip $commands
} catch {
    Write-Host "❌ Erro ao executar deploy: $_" -ForegroundColor Red
}
