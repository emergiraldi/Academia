@echo off
echo ================================================
echo     DEPLOY RAPIDO - Aplicar Correcoes
echo ================================================
echo.

ssh root@72.60.2.237 "cd /var/www/academia && git pull origin main && npm run build && pm2 restart academia-api && echo '' && echo '=== DEPLOY CONCLUIDO ===' && pm2 logs academia-api --nostream --lines 5"

echo.
pause
