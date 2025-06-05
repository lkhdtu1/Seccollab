# SecureCollab Platform Setup Script
# Run this script in PowerShell as Administrator

Write-Host "🚀 Setting up SecureCollab Platform..." -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Function to check if a command exists
function Test-Command {
    param($command)
    try {
        Get-Command $command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

Write-Host "📋 Checking Prerequisites..." -ForegroundColor Cyan

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Python
if (Test-Command "python") {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found. Please install Python 3.8+ from https://python.org/" -ForegroundColor Red
    exit 1
}

# Check Git
if (Test-Command "git") {
    Write-Host "✅ Git found" -ForegroundColor Green
} else {
    Write-Host "❌ Git not found. Please install Git from https://git-scm.com/" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Setting up Backend..." -ForegroundColor Cyan

# Navigate to backend directory
Set-Location backend

# Create virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt

# Add Flask-Migrate if not present
pip install Flask-Migrate

# Create .env file for backend
if (-not (Test-Path ".env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    @"
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-this-in-production

# Database
DATABASE_URL=sqlite:///app.db

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production

# Google Cloud (Optional - for file storage)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=app/config/gcp-credentials.json

# Email Configuration (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Development Settings
DEBUG=True
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ Backend .env created. Please update with your values." -ForegroundColor Green
}

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Yellow
python create_db.py

Write-Host "✅ Backend setup complete!" -ForegroundColor Green

# Navigate back to root
Set-Location ..

Write-Host "🎨 Setting up Frontend..." -ForegroundColor Cyan

# Navigate to frontend directory
Set-Location frontend

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Create .env file for frontend
if (-not (Test-Path ".env")) {
    Write-Host "Creating frontend .env file..." -ForegroundColor Yellow
    @"
# Frontend Configuration
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=http://localhost:5000

# Development
REACT_APP_ENV=development
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ Frontend .env created." -ForegroundColor Green
}

Write-Host "✅ Frontend setup complete!" -ForegroundColor Green

# Navigate back to root
Set-Location ..

Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update the .env files with your configuration values" -ForegroundColor White
Write-Host "2. Start the backend: cd backend ; .\venv\Scripts\Activate.ps1 ; python run.py" -ForegroundColor White
Write-Host "3. Start the frontend: cd frontend ; npm start" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Access the application at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API will be at: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Yellow
