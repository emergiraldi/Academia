$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deploy com debug..." -ForegroundColor Cyan

# SSH command
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
echo '🗑️  5. Limpando logs antigos...' &&
pm2 flush academia-api &&
echo '' &&
echo '========================================' &&
echo '✅ Deploy concluído com sucesso!' &&
echo '========================================' &&
echo '' &&
echo '🔍 Agora acesse a página de pagamentos:' &&
echo 'https://www.sysfitpro.com.br/admin/billing' &&
echo '' &&
echo '📋 Para ver os logs de debug, execute:' &&
echo 'pm2 logs academia-api --lines 50'
"@

# Execute SSH
try {
    echo y | plink -pw "935559Emerson@" root@138.197.8.136 $sshCommand
    Write-Host "`n✅ Deploy finalizado!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Erro no deploy: $_" -ForegroundColor Red
    exit 1
}
