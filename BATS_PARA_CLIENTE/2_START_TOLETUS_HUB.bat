@echo off
title Toletus HUB - Controle de Catraca
color 0B

echo ========================================
echo   INICIANDO TOLETUS HUB
echo ========================================
echo.
echo Este programa controla a catraca automaticamente
echo Mantenha esta janela ABERTA durante o funcionamento
echo.
echo Interface: https://localhost:7067
echo Catraca: 192.168.0.100 (LiteNet3)
echo ========================================
echo.

cd /d C:\SysFit\agent

REM Verifica se já existe o script de start do Toletus
if exist START_TOLETUS_HUB.bat (
    echo Executando script existente do Toletus HUB...
    call START_TOLETUS_HUB.bat
) else (
    echo.
    echo ATENCAO: Arquivo START_TOLETUS_HUB.bat nao encontrado!
    echo.
    echo Por favor, verifique se o Toletus HUB esta instalado em:
    echo C:\SysFit\agent\
    echo.
    echo Ou execute manualmente o aplicativo Toletus HUB
    echo.
    pause
)

pause
