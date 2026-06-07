@echo off
setlocal
set "PATH=%PATH%;C:\Program Files\nodejs"
set "NODE_PATH=%APPDATA%\npm\node_modules"
cd /d "%~dp0"
echo Starting LinguaTutor AI server...
start "LinguaTutor Server" /B "C:\Program Files\nodejs\node.exe" deploy.js
timeout /t 4 /nobreak >nul
echo.
echo ================================================================
echo   LinguaTutor AI — Servidor local
echo ================================================================
echo.
echo   Abre http://localhost:3000 en tu navegador
echo.
echo   Para compartir externamente, necesitas un tunel:
echo   Instala ngrok desde https://ngrok.com o usa:
echo     ssh -R 80:localhost:3000 nokey@localhost.run
echo.
echo ================================================================
echo   Presiona cualquier tecla para detener el servidor...
pause >nul
taskkill /f /im node.exe >nul 2>&1
