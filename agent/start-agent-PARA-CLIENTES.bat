@echo off
REM ================================================
REM  Start Agent SysFit Pro - Auto-Start
REM  VERSÃO PARA ACADEMIAS CLIENTES
REM ================================================

cd /d "C:\SysFit\agent"

REM Verificar se PM2 está instalado
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: PM2 nao esta instalado!
    echo Execute: npm install -g pm2
    pause
    exit /b 1
)

REM Verificar se agent já está rodando
pm2 describe agent-sysfitpro >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Agent ja esta rodando. Reiniciando...
    pm2 restart agent-sysfitpro
) else (
    echo Iniciando agent pela primeira vez...
    pm2 start agent.js --name "agent-sysfitpro"
    pm2 save
)

echo.
echo ================================================
echo  Agent iniciado com sucesso!
echo ================================================
echo.
pm2 status

REM Não fechar automaticamente (remover pause se não quiser ver a saída)
REM pause
