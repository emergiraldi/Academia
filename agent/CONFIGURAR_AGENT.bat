@echo off
echo ================================================
echo     CONFIGURACAO DO AGENT - CLIENTE
echo ================================================
echo.
echo Este script vai te ajudar a configurar o agent
echo para o cliente.
echo.
pause

echo.
echo === PASSO 1: Informacoes da Academia ===
echo.
set /p AGENT_ID="Digite o AGENT_ID (ex: academia-5): "
set /p AUTH_TOKEN="Digite o AUTH_TOKEN: "

echo.
echo === PASSO 2: Informacoes da Leitora Control ID ===
echo.
set /p LEITORA_IP="Digite o IP da leitora Control ID (ex: 192.168.1.100): "
set /p LEITORA_USER="Usuario da leitora (default: admin): "
if "%LEITORA_USER%"=="" set LEITORA_USER=admin
set /p LEITORA_PASS="Senha da leitora (default: admin): "
if "%LEITORA_PASS%"=="" set LEITORA_PASS=admin

echo.
echo === Criando arquivo .env ===
echo.

(
echo # ============================================
echo # CONFIGURACAO DO AGENT CONTROL ID
echo # ============================================
echo.
echo # IP e porta da leitora Control ID ^(rede local^)
echo LEITORA_IP=%LEITORA_IP%
echo LEITORA_PORT=80
echo LEITORA_USERNAME=%LEITORA_USER%
echo LEITORA_PASSWORD=%LEITORA_PASS%
echo.
echo # URL do servidor VPS ^(WebSocket^)
echo # Desenvolvimento: ws://localhost:8080
echo # Producao: wss://seusite.com.br/agent
echo VPS_URL=wss://www.sysfitpro.com.br/agent
echo.
echo # ID unico desta academia/agent
echo AGENT_ID=%AGENT_ID%
echo.
echo # Token de autenticacao ^(gerar um token secreto unico^)
echo AUTH_TOKEN=%AUTH_TOKEN%
echo.
echo # URL do Toletus HUB ^(servidor local que comunica com catracas LiteNet^)
echo TOLETUS_HUB_URL=https://localhost:7067
) > .env

echo.
echo === Arquivo .env criado com sucesso! ===
echo.
echo === Instalando dependencias... ===
call npm install

echo.
echo ================================================
echo     CONFIGURACAO CONCLUIDA!
echo ================================================
echo.
echo Agora voce pode iniciar o agent com:
echo   npm start
echo.
echo Ou instalar como servico PM2:
echo   npm install -g pm2
echo   pm2 start agent.js --name academia-agent
echo   pm2 save
echo   pm2 startup
echo.
pause
