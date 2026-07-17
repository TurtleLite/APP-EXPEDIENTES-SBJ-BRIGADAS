Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  INICIANDO SISTEMA COMPLETO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = Join-Path $PSScriptRoot "backend"
$tunnelFile = Join-Path $env:TEMP "tunnel_url.txt"

# Kill any leftover processes
Get-Process "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Remove old tunnel file
Remove-Item $tunnelFile -ErrorAction SilentlyContinue

Write-Host "[1/4] Iniciando backend..." -ForegroundColor Yellow
$backendJob = Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$backendDir`" && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"
Start-Sleep -Seconds 3

Write-Host "[2/4] Iniciando Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelJob = Start-Process -WindowStyle Hidden -FilePath "cloudflared.exe" -ArgumentList "tunnel", "--url", "http://localhost:8000" -RedirectStandardOutput $tunnelFile

Write-Host "       Esperando URL del tunnel..." -ForegroundColor Gray
$tunnelUrl = $null
$maxWait = 30
for ($i = 0; $i -lt $maxWait; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $tunnelFile) {
        $content = Get-Content $tunnelFile -Raw
        $match = [regex]::Match($content, 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')
        if ($match.Success) {
            $tunnelUrl = $match.Value
            break
        }
    }
}

if (-not $tunnelUrl) {
    Write-Host "ERROR: No se pudo obtener la URL del tunnel" -ForegroundColor Red
    Write-Host "      Revisa que cloudflared esté instalado" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "       Tunnel URL: $tunnelUrl" -ForegroundColor Green

Write-Host "[3/4] Actualizando VITE_API_URL en Render..." -ForegroundColor Yellow
$body = @{ value = $tunnelUrl } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "https://api.render.com/v1/services/srv-d9ckv7e7r5hc738p74tg/env-vars/VITE_API_URL" -Method PUT -Headers @{
        "Accept" = "application/json"
        "Authorization" = "Bearer rnd_PHSxgVEjTBd2Ag86QxCKh40wUcK0"
    } -Body $body -ContentType "application/json"
    Write-Host "       Variable actualizada correctamente" -ForegroundColor Green
} catch {
    Write-Host "ERROR al actualizar variable: $_" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[4/4] Iniciando deploy en Render..." -ForegroundColor Yellow
try {
    $deploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/srv-d9ckv7e7r5hc738p74tg/deploys" -Method POST -Headers @{
        "Accept" = "application/json"
        "Authorization" = "Bearer rnd_PHSxgVEjTBd2Ag86QxCKh40wUcK0"
    }
    Write-Host "       Deploy iniciado (ID: $($deploy.id))" -ForegroundColor Green
} catch {
    Write-Host "ERROR al iniciar deploy: $_" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SISTEMA INICIADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Tunnel:   $tunnelUrl" -ForegroundColor White
Write-Host "  Frontend: https://app-expedientes-sbj-brigadas.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "  El deploy en Render tardara 2-3 minutos." -ForegroundColor Gray
Write-Host "  No cierres esta ventana ni las del backend/tunnel." -ForegroundColor Yellow
Write-Host ""
pause
