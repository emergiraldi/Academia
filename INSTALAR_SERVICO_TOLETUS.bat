@echo off
REM ================================================
REM  Instalar Toletus HUB como Servico do Windows
REM ================================================

echo ================================================
echo  Instalando Toletus HUB como Servico do Windows
echo ================================================
echo.

REM Verificar se esta rodando como Administrador
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERRO: Execute como Administrador!
    echo Clique com botao direito e selecione "Executar como Administrador"
    pause
    exit /b 1
)

echo [1/3] Parando servico se existir...
sc stop ToletusHub >nul 2>&1
sc delete ToletusHub >nul 2>&1

echo [2/3] Criando servico do Windows...
sc create ToletusHub binPath= "dotnet run --urls https://localhost:7067" start= auto
sc config ToletusHub obj= "LocalSystem"
sc config ToletusHub DisplayName= "Toletus Hub - Sistema de Catraca"

REM Configurar para reiniciar automaticamente em caso de falha
sc failure ToletusHub reset= 86400 actions= restart/60000/restart/60000/restart/60000

echo [3/3] Iniciando servico...
sc start ToletusHub

echo.
echo ================================================
echo  Servico instalado com sucesso!
echo ================================================
echo.
echo O Toletus Hub agora inicia automaticamente com o Windows.
echo Para verificar: services.msc
echo.

pause
