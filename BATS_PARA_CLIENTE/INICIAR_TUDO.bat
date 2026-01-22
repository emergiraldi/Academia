@echo off
title Iniciar Sistema Completo - Academia
color 0E

echo ========================================
echo   INICIANDO SISTEMA COMPLETO
echo ========================================
echo.
echo Este script vai iniciar:
echo 1. Agent (Control ID)
echo 2. Toletus HUB (Catraca)
echo.
echo Aguarde...
echo ========================================
echo.

REM Iniciar Agent em uma nova janela
start "Agent Academia 33" /MIN cmd /c "cd /d C:\SysFit\agent && node agent.js"
echo [OK] Agent iniciado em segundo plano

timeout /t 2 /nobreak >nul

REM Iniciar Toletus HUB em uma nova janela
start "Toletus HUB" /MIN cmd /c "cd /d C:\SysFit\agent && START_TOLETUS_HUB.bat"
echo [OK] Toletus HUB iniciado em segundo plano

echo.
echo ========================================
echo   SISTEMA INICIADO COM SUCESSO!
echo ========================================
echo.
echo Ambos os programas estao rodando em segundo plano
echo Verifique na barra de tarefas as janelas minimizadas
echo.
echo IMPORTANTE: Nao feche as janelas do Agent e Toletus!
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
