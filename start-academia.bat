@echo off
title Academia System - Starting...
color 0A

echo ========================================
echo   ACADEMIA SYSTEM
echo   Iniciando servidor...
echo ========================================
echo.

cd /d "C:\Projeto\Academia"

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Iniciando servidor de desenvolvimento...
echo.
echo Acesse: http://localhost:5000
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

npm start

pause
