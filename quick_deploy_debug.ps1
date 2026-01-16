$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deploy..." -ForegroundColor Cyan

$sshCommand = @"
cd /var/www/academia &&
echo '📥 1. Atualizando código...' &&
git pull origin main &&
echo '' &&
echo '🏗️  2. Compilando...' &&
npm run build &&
echo '' &&
echo '🔄 3. Reiniciando PM2...' &&
pm2 restart academia-api &&
echo '' &&
echo '⏳ 4. Aguardando...' &&
sleep 3 &&
echo '' &&
echo '🗑️  5. Limpando logs...' &&
pm2 flush academia-api &&
echo '' &&
echo '✅ Deploy concluído!' &&
echo '' &&
echo '🔍 AGORA ACESSE A PÁGINA E VEJA OS LOGS'
"@

try {
    & "C:\Program Files\Git\usr\bin\ssh.exe" -o StrictHostKeyChecking=no root@72.60.2.237 $sshCommand
    Write-Host "`n✅ Deploy finalizado!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Erro no deploy: $_" -ForegroundColor Red
    exit 1
}
