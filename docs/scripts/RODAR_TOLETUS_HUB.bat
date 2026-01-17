@echo off
echo ================================================
echo     TOLETUS HUB - Servidor Local
echo ================================================
echo.
echo Iniciando Toletus HUB na porta 7067...
echo Este programa precisa ficar rodando!
echo.
echo Pressione Ctrl+C para parar
echo.

cd "\\Mac\Home\Downloads\hub-main\hub-main\src\Toletus.Hub.API"
dotnet run --urls "https://localhost:7067"

pause
