Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy: Correção de Transações" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Executar deploy no servidor
Write-Host "📡 Conectando ao servidor e executando deploy...`n" -ForegroundColor Yellow

# Comando SSH como string única (não será interpretado pelo PowerShell)
ssh -o StrictHostKeyChecking=no root@72.60.2.237 "cd /var/www/academia && echo '📥 1. Atualizando código do GitHub...' && git pull origin main && echo '' && echo '🏗️  2. Compilando projeto...' && npm run build && echo '' && echo '🔄 3. Reiniciando PM2...' && pm2 restart academia-api && echo '' && echo '⏳ 4. Aguardando backend iniciar...' && sleep 3 && echo '' && echo '📋 5. Últimos logs do PM2:' && pm2 logs academia-api --lines 20 --nostream && echo '' && echo '📊 6. Status do PM2:' && pm2 status && echo '' && echo '========================================' && echo '✅ Deploy concluído com sucesso!' && echo '========================================' && echo '' && echo '🌐 Site: https://www.sysfitpro.com.br'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Site: https://www.sysfitpro.com.br`n" -ForegroundColor Cyan
    Write-Host "🔒 CORREÇÃO APLICADA:" -ForegroundColor Yellow
    Write-Host "  - Cadastro de academias agora usa transações atômicas" -ForegroundColor White
    Write-Host "  - Se houver erro, NADA será salvo no banco" -ForegroundColor White
    Write-Host "  - Email é enviado após transação (não desfaz cadastro se falhar)`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Erro durante o deploy!" -ForegroundColor Red
    exit 1
}
