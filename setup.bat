@echo off
chcp 65001 >nul
title APP EXPEDIENTES SBJ BRIGADAS - SETUP
echo ============================================
echo  APP EXPEDIENTES SBJ BRIGADAS
echo  Configuracion del Servidor Windows
echo ============================================
echo.

:: Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no encontrado. Descargalo de https://www.python.org/downloads/
    echo         Marca "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)
echo [OK] Python encontrado

:: Verificar PostgreSQL
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL no encontrado. Descargalo de https://www.postgresql.org/download/windows/
    echo         Usa password: gestion_pass
    pause
    exit /b 1
)
echo [OK] PostgreSQL encontrado

:: Crear base de datos
echo.
echo Creando base de datos y usuario...
psql -U postgres -c "CREATE USER gestion_user WITH PASSWORD 'gestion_pass';" 2>nul
psql -U postgres -c "CREATE DATABASE gestion_db OWNER gestion_user;" 2>nul
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE gestion_db TO gestion_user;" 2>nul
echo [OK] Base de datos configurada

:: Backend setup
echo.
echo Configurando backend...
cd backend

if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate.bat

pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al instalar dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

:: Seed database
echo.
echo Poblando base de datos con usuarios iniciales...
python run_seed.py
echo [OK] Base de datos poblada

:: Crear directorios necesarios
if not exist "uploads" mkdir uploads
if not exist "reports" mkdir reports

cd ..

echo.
echo ============================================
echo  ¡SETUP COMPLETADO!
echo ============================================
echo.
echo Para iniciar el servidor:
echo   1. cd backend
echo   2. venv\Scripts\activate
echo   3. uvicorn app.main:app --host 0.0.0.0 --port 8000
echo.
echo Luego inicia Cloudflare Tunnel:
echo   cloudflared tunnel --url http://localhost:8000
echo.
pause
