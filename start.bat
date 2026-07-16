@echo off
chcp 65001 >nul
title APP EXPEDIENTES SBJ BRIGADAS - BACKEND

cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Ejecuta setup.bat primero
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

echo ============================================
echo  Iniciando backend...
echo ============================================
echo.
echo Abre otra terminal y ejecuta:
echo   cloudflared tunnel --url http://localhost:8000
echo.
echo ============================================
echo.

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
