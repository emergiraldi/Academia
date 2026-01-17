@echo off
REM ================================================
REM  CONFIGURACAO COMPLETA - AUTO START
REM  Toletus HUB + Agent Node.js
REM ================================================

color 0A
echo.
echo ========================================================
echo   CONFIGURACAO AUTOMATICA DO SISTEMA
echo   Toletus HUB + Agent Node.js
echo ========================================================
echo.
echo Este script vai configurar o sistema para iniciar
echo automaticamente quando o Windows ligar.
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

REM ============================================
REM  PARTE 1: Configurar Agent Node.js (PM2)
REM ============================================
echo.
echo [1/2] Configurando Agent Node.js com PM2...
echo.

cd /d "C:\SysFit\agent"

REM Verificar se PM2 esta instalado
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    - Instalando PM2...
    call npm install -g pm2
    call npm install -g pm2-windows-service
) else (
    echo    - PM2 ja instalado
)

echo    - Instalando dependencias do agent...
call npm install

echo    - Configurando PM2...
pm2 delete sysfit-agent >nul 2>nul
pm2 start agent.js --name "sysfit-agent"
pm2 save

echo    - Instalando PM2 como servico do Windows...
pm2-service-install -n PM2 >nul 2>nul

echo    - Configurando startup...
pm2 startup >nul 2>nul

echo.
echo    ✓ Agent configurado!
echo.

REM ============================================
REM  PARTE 2: Configurar Toletus HUB
REM ============================================
echo.
echo [2/2] Configurando Toletus HUB para auto-start...
echo.

REM Criar script VBS para executar em background
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

REM Criar VBS que inicia o Toletus HUB
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\ToletusHub.vbs"
echo WshShell.Run "cmd /c ""cd /d C:\Projeto\Academia\hub-main\hub-main\src\Toletus.Hub.API ^&^& dotnet run --urls https://localhost:7067""", 0, False >> "%TEMP%\ToletusHub.vbs"
echo Set WshShell = Nothing >> "%TEMP%\ToletusHub.vbs"

REM Copiar para pasta Startup
copy /Y "%TEMP%\ToletusHub.vbs" "%STARTUP%\ToletusHub.vbs" >nul

echo    ✓ Toletus HUB configurado!
echo    Arquivo: %STARTUP%\ToletusHub.vbs
echo.

REM ============================================
REM  INICIAR AGORA
REM ============================================
echo.
echo ========================================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================================
echo.
echo ✓ Agent Node.js: Configurado com PM2
echo ✓ Toletus HUB: Configurado para auto-start
echo.
echo O sistema agora inicia automaticamente com o Windows!
echo.
echo Arquivos criados:
echo   - PM2 Service: Agent Node.js em background
echo   - %STARTUP%\ToletusHub.vbs
echo.
echo.
echo Deseja iniciar o sistema AGORA? (S/N)
choice /C SN /N /M "Digite S para Sim ou N para Nao: "

if errorlevel 2 goto FIM
if errorlevel 1 goto INICIAR

:INICIAR
echo.
echo Iniciando sistema...
echo.

REM Iniciar Agent
echo [1/2] Iniciando Agent...
pm2 restart sysfit-agent >nul 2>nul
timeout /t 2 >nul

REM Iniciar Toletus HUB
echo [2/2] Iniciando Toletus HUB...
start /min cmd /c "cd /d C:\Projeto\Academia\hub-main\hub-main\src\Toletus.Hub.API && dotnet run --urls https://localhost:7067"
timeout /t 3 >nul

echo.
echo ✓ Sistema iniciado!
echo.
echo Comandos uteis:
echo   pm2 status       - Ver status do agent
echo   pm2 logs         - Ver logs do agent
echo   pm2 restart all  - Reiniciar agent
echo.
echo IMPORTANTE: Deixe a janela do Toletus HUB aberta em background
echo.

:FIM
echo.
echo Pressione qualquer tecla para sair...
pause >nul
