@echo off
chcp 65001 >nul
title APP EXPEDIENTES SBJ BRIGADAS
cd /d "%~dp0"

echo ============================================
echo  INICIANDO SISTEMA COMPLETO
echo ============================================
echo.

if not exist "backend\venv\Scripts\activate.bat" (
    echo ERROR: Ejecuta setup.bat primero
    pause
    exit /b 1
)

echo [1/2] Iniciando backend...
start "Backend" cmd /c "cd /d backend && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Cloudflare Tunnel...
echo.
echo ============================================
echo  ESPERA a que aparezca la URL
echo  tipo: https://xxx.trycloudflare.com
echo  Copiala y actualiza VITE_API_URL en Render
echo  Luego haz deploy en Render
echo ============================================
echo.
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:8000"

echo.
echo Ambas ventanas estan abiertas.
echo Cierra esta ventana cuando quieras.
pause
