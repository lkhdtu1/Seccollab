#!/bin/bash

# SecureCollab Platform Setup Script
# Run this script with: chmod +x setup.sh && ./setup.sh

set -e  # Exit on any error

echo "🚀 Setting up SecureCollab Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${CYAN}📋 Checking Prerequisites...${NC}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org/${NC}"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python found: $PYTHON_VERSION${NC}"
    PYTHON_CMD=python3
elif command_exists python; then
    PYTHON_VERSION=$(python --version)
    echo -e "${GREEN}✅ Python found: $PYTHON_VERSION${NC}"
    PYTHON_CMD=python
else
    echo -e "${RED}❌ Python not found. Please install Python 3.8+ from https://python.org/${NC}"
    exit 1
fi

# Check pip
if command_exists pip3; then
    PIP_CMD=pip3
elif command_exists pip; then
    PIP_CMD=pip
else
    echo -e "${RED}❌ pip not found. Please install pip${NC}"
    exit 1
fi

# Check Git
if command_exists git; then
    echo -e "${GREEN}✅ Git found${NC}"
else
    echo -e "${RED}❌ Git not found. Please install Git from https://git-scm.com/${NC}"
    exit 1
fi

echo -e "${CYAN}🔧 Setting up Backend...${NC}"

# Navigate to backend directory
cd backend

# Create virtual environment
echo -e "${YELLOW}Creating Python virtual environment...${NC}"
$PYTHON_CMD -m venv venv

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
$PIP_CMD install --upgrade pip

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
$PIP_CMD install -r requirements.txt

# Add Flask-Migrate if not present
$PIP_CMD install Flask-Migrate

# Create .env file for backend
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > .env << EOL
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
EOL
    echo -e "${GREEN}✅ Backend .env created. Please update with your values.${NC}"
fi

# Initialize database
echo -e "${YELLOW}Initializing database...${NC}"
$PYTHON_CMD create_db.py

echo -e "${GREEN}✅ Backend setup complete!${NC}"

# Navigate back to root
cd ..

echo -e "${CYAN}🎨 Setting up Frontend...${NC}"

# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install

# Create .env file for frontend
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > .env << EOL
# Frontend Configuration
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=http://localhost:5000

# Development
REACT_APP_ENV=development
EOL
    echo -e "${GREEN}✅ Frontend .env created.${NC}"
fi

echo -e "${GREEN}✅ Frontend setup complete!${NC}"

# Navigate back to root
cd ..

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${CYAN}📝 Next Steps:${NC}"
echo -e "${NC}1. Update the .env files with your configuration values${NC}"
echo -e "${NC}2. Start the backend: cd backend && source venv/bin/activate && python run.py${NC}"
echo -e "${NC}3. Start the frontend: cd frontend && npm start${NC}"
echo ""
echo -e "${CYAN}🌐 Access the application at: http://localhost:3000${NC}"
echo -e "${CYAN}🔧 Backend API will be at: http://localhost:5000${NC}"
echo ""
echo -e "${YELLOW}For more information, see README.md${NC}"
