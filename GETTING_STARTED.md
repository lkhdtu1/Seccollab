# 🚀 Quick Start Guide for SecureCollab Platform

This guide will help you get the SecureCollab Platform up and running quickly.

## 📋 Prerequisites Check

Before starting, verify you have these installed:

```bash
# Check Node.js (should be 16+)
node --version

# Check Python (should be 3.8+)
python --version

# Check Git
git --version

# Check npm
npm --version
```

## 🎯 Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/secure-collab-platform.git
cd secure-collab-platform
```

### 2. Run Setup Script

#### Windows (PowerShell as Administrator)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

#### Linux/macOS
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Configure Environment Variables

#### Backend Configuration
Edit `backend/.env`:
```env
SECRET_KEY=your-unique-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
```

#### Frontend Configuration
Edit `frontend/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 4. Start the Applications

#### Terminal 1 - Backend
```bash
cd backend
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

python run.py
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs (if available)

## 🔧 Development Workflow

### Backend Development
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install new dependencies
pip install package-name
pip freeze > requirements.txt

# Run tests
pytest

# Database operations
python create_db.py  # Initialize/reset database
```

### Frontend Development
```bash
cd frontend

# Install new dependencies
npm install package-name

# Run tests
npm test

# Build for production
npm run build

# Analyze bundle
npm run build -- --analyze
```

## 🐛 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Port already in use
```bash
# Find process using port 5000
netstat -ano | findstr :5000
# Kill process (Windows)
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:5000 | xargs kill -9
```

#### Database issues
```bash
cd backend
rm instance/app.db
python create_db.py
```

#### Permission errors (Windows)
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Environment Setup Issues

#### Python Virtual Environment
```bash
# If venv creation fails
python -m pip install --upgrade pip
python -m pip install virtualenv
python -m virtualenv venv
```

#### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm@latest
```

## 🚢 Production Deployment

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Production Setup
```bash
# Backend
cd backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app

# Frontend
cd frontend
npm run build
# Serve build folder with nginx/apache
```

## 🔑 Default Credentials

After setup, you can create an admin user:

```bash
cd backend
python -c "
from app import create_app
from app.models.user import User, db

app = create_app()
with app.app_context():
    admin = User(
        email='admin@example.com',
        name='Admin User'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    print('Admin user created: admin@example.com / admin123')
"
```

## 📚 Next Steps

1. **Security**: Change all default passwords and secret keys
2. **Database**: Consider migrating to PostgreSQL for production
3. **Storage**: Configure Google Cloud Storage for file uploads
4. **Monitoring**: Set up logging and monitoring
5. **SSL**: Configure HTTPS for production

## 🆘 Getting Help

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the `docs/` folder
- **API**: Use the interactive API documentation
- **Logs**: Check backend logs for detailed error messages

---

**Happy Coding! 🎉**
