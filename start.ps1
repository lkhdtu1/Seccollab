# Quick start script for SecureCollab Platform (Windows)

Write-Host "🚀 Starting SecureCollab Platform..." -ForegroundColor Green

# Check if setup has been run
if (-not (Test-Path "backend\venv")) {
    Write-Host "❌ Setup not completed. Please run .\setup.ps1 first" -ForegroundColor Red
    exit 1
}

# Start backend in background
Write-Host "🔧 Starting Backend..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location "backend"
    & ".\venv\Scripts\Activate.ps1"
    python run.py
}

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend started successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend may still be starting..." -ForegroundColor Yellow
}

# Start frontend in background
Write-Host "🎨 Starting Frontend..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "frontend"
    npm start
}

Write-Host "🎉 Both services are starting!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop services" -ForegroundColor Yellow

# Wait for user to stop
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
    Stop-Job $backendJob -Force
    Stop-Job $frontendJob -Force
    Remove-Job $backendJob -Force
    Remove-Job $frontendJob -Force
    Write-Host "✅ Services stopped" -ForegroundColor Green
}
