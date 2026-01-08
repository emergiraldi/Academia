@echo off
setlocal enabledelayedexpansion

echo ========================================
echo DEPLOY DO BANCO DE DADOS - VPS
echo ========================================
echo.

if not exist "academia_db_backup.sql" (
    echo ERRO: Arquivo academia_db_backup.sql nao encontrado!
    pause
    exit /b 1
)

echo Arquivo de backup encontrado!
echo.
echo ========================================
echo INSTRUCOES:
echo ========================================
echo.
echo Este script vai abrir 2 janelas que pedirao senha.
echo.
echo Senha: 935559Emerson@
echo.
echo 1. Primeira janela: Upload do arquivo SQL
echo 2. Segunda janela: Restauracao do banco
echo.
echo Pressione qualquer tecla para continuar...
pause > nul
echo.

echo ===== PASSO 1: UPLOAD DO BACKUP =====
echo.
echo Abrindo janela SCP...
echo Digite a senha quando solicitado: 935559Emerson@
echo.

start /wait cmd /c "scp -o StrictHostKeyChecking=no academia_db_backup.sql root@72.60.2.237:/var/www/academia/ && echo. && echo Upload concluido! && pause"

echo.
echo ===== PASSO 2: RESTAURACAO NA VPS =====
echo.
echo Abrindo janela SSH...
echo Digite a senha quando solicitado: 935559Emerson@
echo.

start /wait cmd /c "ssh -o StrictHostKeyChecking=no root@72.60.2.237 \"cd /var/www/academia && git pull origin main && mysql -u root -e 'DROP DATABASE IF EXISTS academia_db;' && mysql -u root < academia_db_backup.sql && rm academia_db_backup.sql && npm run build && pm2 restart academia-api && sleep 3 && pm2 logs academia-api --lines 30 --nostream && pm2 status\" && pause"

echo.
echo ========================================
echo DEPLOY FINALIZADO!
echo ========================================
echo.
echo Acesse: https://www.sysfitpro.com.br
echo.
pause
