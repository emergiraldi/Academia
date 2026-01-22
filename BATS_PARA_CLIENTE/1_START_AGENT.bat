@echo off
title Agent Academia - Control ID
color 0A

echo ========================================
echo   INICIANDO AGENT ACADEMIA 33
echo ========================================
echo.
echo Este programa conecta o sistema ao Control ID
echo Mantenha esta janela ABERTA durante o funcionamento
echo.
echo Pressione Ctrl+C para PARAR o agent
echo ========================================
echo.

cd /d C:\SysFit\agent
node agent.js

pause
