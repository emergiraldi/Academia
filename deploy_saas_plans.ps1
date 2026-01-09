# Deploy do Sistema de Planos SaaS
Write-Host "Iniciando deploy do sistema de planos SaaS..." -ForegroundColor Cyan

$password = "935559Emerson@"
$server = "root@138.197.8.136"

# Comando SSH
$sshCommand = @"
cd /var/www/academia &&
echo '📥 1. Atualizando código do GitHub...' &&
git pull origin main &&
echo '' &&
echo '🏗️  2. Compilando projeto...' &&
npm run build &&
echo '' &&
echo '🔄 3. Reiniciando PM2...' &&
pm2 restart academia-api &&
echo '' &&
echo '⏳ 4. Aguardando backend iniciar...' &&
sleep 3 &&
echo '' &&
echo '📋 5. Últimos logs do PM2:' &&
pm2 logs academia-api --lines 20 --nostream &&
echo '' &&
echo '📊 6. Status do PM2:' &&
pm2 status &&
echo '' &&
echo '========================================' &&
echo '✅ Deploy concluído com sucesso!' &&
echo '========================================' &&
echo '' &&
echo '🌐 Site: https://www.sysfitpro.com.br'
"@

# Executar comando via plink (PuTTY)
Write-Host "`nExecutando deploy via SSH..." -ForegroundColor Yellow
echo y | plink -batch -pw $password $server $sshCommand

Write-Host "`n✅ Script concluído!" -ForegroundColor Green
