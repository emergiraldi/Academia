Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy: Configurações de Trial Period" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Copiar script de migração para o servidor
Write-Host "📤 1. Enviando script de migração..." -ForegroundColor Yellow
sshpass -p "935559Emerson@" scp -o StrictHostKeyChecking=no add_trial_settings.js root@138.197.8.136:/var/www/academia/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar arquivo!" -ForegroundColor Red
    exit 1
}

# Executar deploy no servidor
Write-Host "`n📡 2. Executando no servidor..." -ForegroundColor Yellow
sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 @"
cd /var/www/academia && \
echo '📥 1. Atualizando código do GitHub...' && \
git pull origin main && \
echo '' && \
echo '🔧 2. Adicionando campos de trial ao banco de dados...' && \
node add_trial_settings.js && \
echo '' && \
echo '🏗️  3. Compilando projeto...' && \
npm run build && \
echo '' && \
echo '🔄 4. Reiniciando PM2...' && \
pm2 restart academia-api && \
echo '' && \
echo '⏳ 5. Aguardando backend iniciar...' && \
sleep 3 && \
echo '' && \
echo '📋 6. Últimos logs do PM2:' && \
pm2 logs academia-api --lines 20 --nostream && \
echo '' && \
echo '📊 7. Status do PM2:' && \
pm2 status && \
echo '' && \
echo '========================================' && \
echo '✅ Deploy concluído com sucesso!' && \
echo '========================================' && \
echo '' && \
echo '🌐 Site: https://www.sysfitpro.com.br'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Site: https://www.sysfitpro.com.br`n" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Erro durante o deploy!" -ForegroundColor Red
    exit 1
}
