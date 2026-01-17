@echo off
REM ================================================
REM  Configurar Toletus HUB para Auto-Start
REM ================================================

echo ================================================
echo  Configurando Toletus HUB para Auto-Start
echo ================================================
echo.

REM Criar script de inicializacao oculto
echo @echo off > "%TEMP%\start_toletus_hidden.bat"
echo cd /d "C:\SysFit\agent\hub-main\src\Toletus.Hub.API" >> "%TEMP%\start_toletus_hidden.bat"
echo start /min cmd /c "dotnet run --urls https://localhost:7067" >> "%TEMP%\start_toletus_hidden.bat"

REM Criar VBS para executar sem janela
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\start_toletus.vbs"
echo WshShell.Run chr(34) ^& "%TEMP%\start_toletus_hidden.bat" ^& chr(34), 0 >> "%TEMP%\start_toletus.vbs"
echo Set WshShell = Nothing >> "%TEMP%\start_toletus.vbs"

REM Copiar VBS para pasta Startup
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy /Y "%TEMP%\start_toletus.vbs" "%STARTUP%\ToletusHub.vbs"
copy /Y "%TEMP%\start_toletus_hidden.bat" "%STARTUP%\start_toletus_hidden.bat"

echo.
echo ================================================
echo  Toletus HUB configurado para auto-start!
echo ================================================
echo.
echo O Toletus Hub agora inicia automaticamente quando o Windows ligar.
echo Arquivo criado em: %STARTUP%\ToletusHub.vbs
echo.
echo Para testar agora, execute: %STARTUP%\ToletusHub.vbs
echo.

pause
