@echo off
echo ======================================
echo  Deploy Academia System para VPS
echo ======================================
echo.

echo Conectando na VPS...
echo Senha: 935559Emerson@
echo.

ssh root@138.197.8.136 "cd /var/www/academia && bash fix_vps_db.sh"

echo.
echo ======================================
echo  Deploy concluido!
echo ======================================
echo.
echo Credenciais:
echo   Email: admin@fitlife.com
echo   Senha: admin123
echo   CNPJ teste: 23.538.490/0001-80
echo.

pause
