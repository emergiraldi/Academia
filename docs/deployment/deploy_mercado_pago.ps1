# Script de Deploy - Mercado Pago Integration
# Este script adiciona suporte ao Mercado Pago preservando dados do Sicoob

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOY: Integração Mercado Pago" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configurações
$SERVER = "root@138.197.8.136"
$PASSWORD = "935559Emerson@"
$REMOTE_PATH = "/var/www/academia"

Write-Host "📥 1. Enviando arquivo de migração para o servidor..." -ForegroundColor Yellow
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no add_mercado_pago_fields.mjs ${SERVER}:${REMOTE_PATH}/

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Erro ao enviar arquivo de migração!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Arquivo enviado com sucesso!`n" -ForegroundColor Green

Write-Host "🔄 2. Executando deploy completo no servidor...`n" -ForegroundColor Yellow

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER @"
cd $REMOTE_PATH && \
echo '📥 Atualizando código do GitHub...' && \
git pull origin main && \
echo '' && \
echo '🗄️  Executando migração do banco de dados...' && \
node add_mercado_pago_fields.mjs && \
echo '' && \
echo '🏗️  Compilando projeto...' && \
npm run build && \
echo '' && \
echo '🔄 Reiniciando PM2...' && \
pm2 restart academia-api && \
echo '' && \
echo '⏳ Aguardando backend iniciar...' && \
sleep 3 && \
echo '' && \
echo '📋 Últimos logs do PM2:' && \
pm2 logs academia-api --lines 20 --nostream && \
echo '' && \
echo '📊 Status do PM2:' && \
pm2 status && \
echo '' && \
echo '========================================' && \
echo '✅ DEPLOY CONCLUÍDO COM SUCESSO!' && \
echo '========================================' && \
echo '' && \
echo '🌐 Site: https://www.sysfitpro.com.br' && \
echo '💳 Configure Mercado Pago em: /admin/bank-accounts' && \
echo '' && \
echo '📋 Funcionalidades adicionadas:' && \
echo '   ✅ Seleção de provedor PIX (Sicoob ou Mercado Pago)' && \
echo '   ✅ Campos específicos para Mercado Pago (Access Token, Public Key)' && \
echo '   ✅ Campos específicos para Sicoob (certificados, OAuth)' && \
echo '   ✅ Badges visuais coloridos na tabela' && \
echo '   ✅ Dados existentes do Sicoob preservados' && \
echo ''
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`n💡 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Acesse: https://www.sysfitpro.com.br/admin/bank-accounts" -ForegroundColor White
    Write-Host "   2. Selecione 'Mercado Pago' no campo 'Provedor PIX'" -ForegroundColor White
    Write-Host "   3. Insira as credenciais do Mercado Pago" -ForegroundColor White
    Write-Host "   4. Teste gerando uma cobrança PIX`n" -ForegroundColor White
} else {
    Write-Host "`n❌ ERRO durante o deploy!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes.`n" -ForegroundColor Yellow
    exit 1
}
