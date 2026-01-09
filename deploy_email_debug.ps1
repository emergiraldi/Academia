Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy: Logs de Debug de Email" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📡 Executando deploy no servidor...`n" -ForegroundColor Yellow

ssh -o StrictHostKeyChecking=no root@72.60.2.237 "cd /var/www/academia && echo '📥 Atualizando código...' && git pull origin main && echo '' && echo '🏗️  Compilando...' && npm run build && echo '' && echo '🔄 Reiniciando...' && pm2 restart academia-api && echo '' && echo '⏳ Aguardando...' && sleep 3 && echo '' && echo '✅ Deploy concluído!'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Cadastre uma nova academia em https://www.sysfitpro.com.br" -ForegroundColor White
    Write-Host "2. Verifique os logs detalhados de debug no servidor" -ForegroundColor White
    Write-Host "3. Procure por linhas começando com [Email] 🔍 DEBUG" -ForegroundColor White
    Write-Host "`n💡 Para ver os logs em tempo real:" -ForegroundColor Cyan
    Write-Host "   ssh root@72.60.2.237" -ForegroundColor White
    Write-Host "   pm2 logs academia-api --lines 50`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Erro durante o deploy!" -ForegroundColor Red
    exit 1
}
