Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 DEPLOY DO TESTE DE CRON DE MENSALIDADES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Preparar banco de dados (verificar planos e deletar mensalidades)
Write-Host "📋 Passo 1: Verificando planos e deletando mensalidades..." -ForegroundColor Yellow
sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 "cd /var/www/academia && node prepare_cron_test.js"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao preparar o banco de dados" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Passo 2: Deploy do código com cron modificado
Write-Host "📥 Passo 2: Fazendo deploy do código..." -ForegroundColor Yellow
Write-Host ""

sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 @"
cd /var/www/academia &&
echo '📥 Atualizando código do GitHub...' &&
git pull origin main &&
echo '' &&
echo '🏗️  Compilando projeto...' &&
npm run build &&
echo '' &&
echo '🔄 Reiniciando PM2...' &&
pm2 restart academia-api &&
echo '' &&
echo '⏳ Aguardando backend iniciar...' &&
sleep 3 &&
echo '' &&
echo '📊 Status do PM2:' &&
pm2 status &&
echo '' &&
echo '========================================' &&
echo '✅ Deploy concluído!' &&
echo '========================================' &&
echo '' &&
echo '⏰ O cron agora roda A CADA MINUTO' &&
echo '   Aguarde 1-2 minutos e verifique:' &&
echo '' &&
echo '   https://www.sysfitpro.com.br/admin/billing' &&
echo '' &&
echo '   As mensalidades devem ser criadas automaticamente' &&
echo '   com o valor do plano cadastrado no banco!' &&
echo ''
"@

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ TESTE CONFIGURADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Aguarde 1-2 minutos" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Acesse: https://www.sysfitpro.com.br/admin/billing" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Verifique se a mensalidade foi criada automaticamente" -ForegroundColor White
Write-Host "    com o valor correto do plano" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Teste também criando uma mensalidade com vencimento" -ForegroundColor White
Write-Host "    passado para ver se o cron muda o status para 'overdue'" -ForegroundColor White
Write-Host ""
