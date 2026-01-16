@echo off
REM ================================================
REM  Configuração do Agent SysFitPro
REM  IMPORTANTE: CADA ACADEMIA PRECISA DO SEU PRÓPRIO AGENT!
REM ================================================

echo.
echo ================================================
echo   CONFIGURACAO DO AGENT SYSFITPRO
echo ================================================
echo.
echo IMPORTANTE: Cada academia precisa do seu proprio agent!
echo.

REM Verificar se .env já existe
if exist ".env" (
    echo AVISO: Arquivo .env ja existe!
    echo.
    choice /C SN /M "Deseja reconfigurar"
    if errorlevel 2 (
        echo Configuracao cancelada.
        pause
        exit /b 0
    )
    echo.
)

REM Solicitar ID da Academia
echo.
echo ================================================
echo  PASSO 1: ID DA ACADEMIA
echo ================================================
echo.
echo Para descobrir o ID da sua academia:
echo 1. Acesse: https://www.sysfitpro.com.br/admin/login
echo 2. Faca login como administrador
echo 3. Va em: Configuracoes ^> Control ID
echo 4. O ID da academia aparecera na pagina
echo.
set /p GYM_ID="Digite o ID da sua academia (exemplo: 33): "

REM Validar ID
if "%GYM_ID%"=="" (
    echo ERRO: ID da academia nao pode ser vazio!
    pause
    exit /b 1
)

REM Solicitar IP da Leitora
echo.
echo ================================================
echo  PASSO 2: IP DA LEITORA CONTROL ID
echo ================================================
echo.
echo Digite o IP da leitora Control ID na sua rede local
echo Exemplo: 192.168.1.100
echo.
set /p LEITORA_IP="IP da leitora: "

if "%LEITORA_IP%"=="" (
    set LEITORA_IP=192.168.2.142
    echo Usando IP padrao: %LEITORA_IP%
)

REM Solicitar porta
echo.
set /p LEITORA_PORT="Porta da leitora (padrao 80): "
if "%LEITORA_PORT%"=="" set LEITORA_PORT=80

REM Solicitar credenciais
echo.
echo ================================================
echo  PASSO 3: CREDENCIAIS DA LEITORA
echo ================================================
echo.
set /p LEITORA_USER="Usuario (padrao admin): "
if "%LEITORA_USER%"=="" set LEITORA_USER=admin

set /p LEITORA_PASS="Senha (padrao admin): "
if "%LEITORA_PASS%"=="" set LEITORA_PASS=admin

REM URL da VPS
echo.
echo ================================================
echo  PASSO 4: URL DO SERVIDOR
echo ================================================
echo.
echo URL do servidor SysFitPro (WebSocket)
set VPS_URL=wss://www.sysfitpro.com.br
echo Usando: %VPS_URL%

REM Gerar .env
echo.
echo ================================================
echo  GERANDO ARQUIVO DE CONFIGURACAO...
echo ================================================
echo.

(
echo # Configuracao do Agent SysFitPro
echo # Academia ID: %GYM_ID%
echo # Gerado em: %date% %time%
echo.
echo # IMPORTANTE: NAO COMPARTILHE ESTE ARQUIVO!
echo # Cada academia tem sua propria configuracao
echo.
echo # ID do Agent (baseado no ID da academia^)
echo AGENT_ID=academia-%GYM_ID%
echo.
echo # Leitora Control ID (rede local^)
echo LEITORA_IP=%LEITORA_IP%
echo LEITORA_PORT=%LEITORA_PORT%
echo LEITORA_USERNAME=%LEITORA_USER%
echo LEITORA_PASSWORD=%LEITORA_PASS%
echo.
echo # Servidor VPS (WebSocket^)
echo VPS_URL=%VPS_URL%
echo.
echo # Token de autenticacao (gerado automaticamente^)
echo AUTH_TOKEN=%RANDOM%%RANDOM%%RANDOM%
) > .env

echo ================================================
echo   CONFIGURACAO CONCLUIDA COM SUCESSO!
echo ================================================
echo.
echo Arquivo .env criado com:
echo   - AGENT_ID: academia-%GYM_ID%
echo   - LEITORA_IP: %LEITORA_IP%
echo   - LEITORA_PORT: %LEITORA_PORT%
echo   - VPS_URL: %VPS_URL%
echo.
echo ================================================
echo  PROXIMO PASSO: INICIAR O AGENT
echo ================================================
echo.
echo Execute: start-agent-PARA-CLIENTES.bat
echo.
pause
