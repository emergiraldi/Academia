Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 DEPLOY DA CORREÇÃO DE DATA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📥 Fazendo deploy..." -ForegroundColor Yellow
Write-Host ""

powershell -Command "ssh root@72.60.2.237 'cd /var/www/academia && echo ""📥 Atualizando código..."" && git pull origin main && echo """" && echo ""🏗️  Compilando..."" && npm run build && echo """" && echo ""🔄 Reiniciando..."" && pm2 restart academia-api && echo """" && echo ""⏳ Aguardando..."" && sleep 3 && echo """" && echo ""✅ Deploy concluído!"" && echo """" && echo ""🌐 Acesse: https://www.sysfitpro.com.br/admin/billing"" && echo ""   A data agora deve aparecer correta (09 de janeiro)!""'"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 TESTE A CORREÇÃO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acesse: https://www.sysfitpro.com.br/admin/billing" -ForegroundColor White
Write-Host ""
Write-Host "A data de vencimento agora deve aparecer como:" -ForegroundColor White
Write-Host "  09 de janeiro de 2026  ✅" -ForegroundColor Green
Write-Host ""
Write-Host "Ao invés de:" -ForegroundColor White
Write-Host "  08 de janeiro de 2026  ❌" -ForegroundColor Red
Write-Host ""
