@echo off
echo ================================================
echo     DEPLOY - Fix Status PIX
echo ================================================
echo.

REM Usando plink do PuTTY para SSH com senha
echo Conectando ao servidor...
echo.

plink -batch -pw "935559Emerson@" root@138.197.8.136 "cd /var/www/academia && echo 'Atualizando codigo...' && git pull origin main && echo '' && echo 'Compilando...' && npm run build && echo '' && echo 'Reiniciando PM2...' && pm2 restart academia-api && sleep 3 && echo '' && echo 'Status:' && pm2 status"

echo.
echo ================================================
echo     Deploy concluido!
echo ================================================
echo.
echo O webhook agora aceita:
echo   - Liquidado
echo   - QUITADO
echo   - PAGO
echo   - CONCLUIDA
echo.
pause
