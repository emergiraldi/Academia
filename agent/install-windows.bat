@echo off
echo ========================================
echo   Control ID Agent - Instalador Windows
echo ========================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, baixe e instale Node.js LTS:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version
echo.

REM Instalar dependências
echo Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

REM Verificar se .env existe
if not exist .env (
    echo [AVISO] Arquivo .env nao encontrado
    echo Copiando .env.example para .env...
    copy .env.example .env
    echo.
    echo IMPORTANTE: Edite o arquivo .env com as configuracoes corretas!
    echo - LEITORA_IP
    echo - VPS_URL
    echo - AUTH_TOKEN
    echo.
    notepad .env
)

REM Instalar PM2 globalmente
echo Instalando PM2...
call npm install -g pm2
call npm install -g pm2-windows-startup
if %errorlevel% neq 0 (
    echo [AVISO] Falha ao instalar PM2. Tentando continuar...
)
echo.

REM Configurar PM2 para iniciar com Windows
echo Configurando PM2 para iniciar com Windows...
call pm2-startup install
echo.

REM Iniciar agent com PM2
echo Iniciando agent...
call pm2 start agent.js --name controlid-agent
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao iniciar agent
    pause
    exit /b 1
)
echo.

REM Salvar configuração do PM2
echo Salvando configuracao do PM2...
call pm2 save
echo.

echo ========================================
echo   Instalacao Concluida!
echo ========================================
echo.
echo O agent está rodando!
echo.
echo Comandos uteis:
echo   pm2 status              - Ver status
echo   pm2 logs controlid-agent - Ver logs
echo   pm2 restart controlid-agent - Reiniciar
echo   pm2 stop controlid-agent    - Parar
echo.

REM Mostrar logs
echo Mostrando logs (Ctrl+C para sair):
call pm2 logs controlid-agent
