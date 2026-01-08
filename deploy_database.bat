@echo off
echo ========================================
echo DEPLOY + Restauracao do Banco de Dados
echo ========================================
echo.

if not exist "academia_db_backup.sql" (
    echo ERRO: Arquivo academia_db_backup.sql nao encontrado!
    echo Execute primeiro: node export_database.js
    pause
    exit /b 1
)

echo Informacoes do backup:
dir academia_db_backup.sql | findstr "academia"
echo.

echo ATENCAO: Isso vai SUBSTITUIR todo o banco de dados na VPS!
set /p confirm="Continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo Operacao cancelada
    pause
    exit /b 1
)
echo.

echo Fazendo upload do backup para VPS...
echo.
echo INSTRUCOES:
echo 1. Quando solicitar senha, digite: 935559Emerson@
echo 2. O upload pode demorar alguns minutos...
echo.

scp -o StrictHostKeyChecking=no academia_db_backup.sql root@138.197.8.136:/var/www/academia/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO no upload!
    echo.
    echo SOLUCAO ALTERNATIVA:
    echo Use WinSCP ou FileZilla para copiar o arquivo:
    echo - Servidor: 138.197.8.136
    echo - Usuario: root
    echo - Senha: 935559Emerson@
    echo - Arquivo local: %CD%\academia_db_backup.sql
    echo - Destino: /var/www/academia/
    pause
    exit /b 1
)

echo.
echo Upload concluido!
echo.
echo Executando restauracao na VPS...
echo.

ssh -o StrictHostKeyChecking=no root@138.197.8.136 "cd /var/www/academia && echo 'Atualizando codigo...' && git pull origin main && echo 'Restaurando banco...' && mysql -u root -e 'DROP DATABASE IF EXISTS academia_db;' && mysql -u root < academia_db_backup.sql && rm academia_db_backup.sql && echo 'Compilando...' && npm run build && echo 'Reiniciando...' && pm2 restart academia-api && sleep 3 && pm2 logs academia-api --lines 20 --nostream"

echo.
echo ========================================
echo Deploy e restauracao concluidos!
echo ========================================
echo.
echo Site: https://www.sysfitpro.com.br
echo.
pause
