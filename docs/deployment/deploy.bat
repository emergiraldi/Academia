@echo off
echo ========================================
echo   DEPLOY - SISTEMA DE PLANOS DINAMICOS
echo ========================================
echo.
echo Conectando ao servidor via SSH...
echo Senha: 935559Emerson@
echo.
ssh root@138.197.8.136 "cd /var/www/academia && echo '📥 1. Atualizando código do GitHub...' && git pull origin main && echo '' && echo '🏗️  2. Compilando projeto...' && npm run build && echo '' && echo '🔄 3. Reiniciando PM2...' && pm2 restart academia-api && echo '' && echo '⏳ 4. Aguardando backend iniciar...' && sleep 3 && echo '' && echo '📋 5. Últimos logs do PM2:' && pm2 logs academia-api --lines 20 --nostream && echo '' && echo '📊 6. Status do PM2:' && pm2 status && echo '' && echo '========================================' && echo '✅ Deploy concluído com sucesso!' && echo '========================================' && echo '' && echo '🌐 Site: https://www.sysfitpro.com.br'"
pause
