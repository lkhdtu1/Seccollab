# SecureCollab Platform

A comprehensive secure collaboration platform with file sharing, real-time chat, user management, and advanced security features.

## 🚀 Features

- **🔐 Secure Authentication**: JWT tokens, OAuth2, and two-factor authentication (2FA)
- **📁 File Management**: Secure file upload, sharing, and management with encryption
- **💬 Real-time Chat**: WebSocket-based messaging system
- **👥 User Management**: Admin panel with role-based access control
- **📊 Dashboard Analytics**: Interactive charts and statistics
- **🔍 Advanced Search**: Multi-filter search capabilities
- **📱 Responsive Design**: Mobile-friendly interface with dark mode support
- **🛡️ Security Features**: AES encryption, bcrypt hashing, and comprehensive logging

## 🛠️ Technologies

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Chart.js & Recharts** for data visualization
- **Socket.IO** for real-time communication
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Flask** (Python) with RESTful API
- **SQLAlchemy** ORM with SQLite database
- **Flask-SocketIO** for WebSocket communication
- **Flask-JWT-Extended** for authentication
- **Google Cloud Storage** integration
- **Cryptography** for encryption

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://python.org/)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** (comes with Node.js)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

#### Windows (PowerShell)
```powershell
# Run PowerShell as Administrator
git clone https://github.com/yourusername/secure-collab-platform.git
cd secure-collab-platform
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

#### Linux/macOS (Bash)
```bash
git clone https://github.com/yourusername/secure-collab-platform.git
cd secure-collab-platform
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/secure-collab-platform.git
cd secure-collab-platform
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python create_db.py
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

## 🔧 Configuration

### Backend Configuration (backend/.env)
```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-here

# Database
DATABASE_URL=sqlite:///app.db

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here

# Google Cloud (Optional)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=app/config/gcp-credentials.json

# Email Configuration (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Frontend Configuration (frontend/.env)
```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=http://localhost:5000

# Environment
REACT_APP_ENV=development
```

## 🏃‍♂️ Running the Application

### Start Backend
```bash
cd backend
# Activate virtual environment first
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
python run.py
```
Backend will be available at: `http://localhost:5000`

### Start Frontend
```bash
cd frontend
npm start
```
Frontend will be available at: `http://localhost:3000`

## 📖 API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `POST /users/change-password` - Change password
- `GET /users/` - List users (admin)

### File Management
- `POST /files/upload` - Upload file
- `GET /files/` - List user files
- `GET /files/{id}` - Get file details
- `DELETE /files/{id}` - Delete file
- `POST /files/{id}/share` - Share file

### Real-time Features
- WebSocket connection at `/socket.io/`
- Events: `message`, `user_activity`, `file_update`

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
python tests/test_integration.py
```

## 🚀 Deployment

### Using Docker
```bash
docker-compose up --build
```

### Manual Deployment
1. Set environment variables for production
2. Build frontend: `cd frontend && npm run build`
3. Configure web server (nginx/apache)
4. Use production WSGI server (gunicorn)

### Environment Variables for Production
```env
FLASK_ENV=production
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=your-production-database-url
```

## 🔒 Security Features

- **Password Security**: bcrypt hashing with salt
- **JWT Authentication**: Secure token-based auth
- **File Encryption**: AES encryption for stored files
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data validation
- **CORS Configuration**: Secure cross-origin requests
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Input sanitization

## 📁 Project Structure

```
secure-collab-platform/
├── backend/                 # Flask backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── migrations/         # Database migrations
│   ├── tests/             # Backend tests
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── package.json       # Node.js dependencies
├── docs/                  # Documentation
├── tests/                 # Integration tests
└── docker-compose.yml     # Docker configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Backend not starting:**
- Check if Python virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check database initialization: `python create_db.py`

**Frontend not loading:**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if backend is running on port 5000

**Database errors:**
- Reset database: `rm instance/app.db && python create_db.py`
- Check database permissions

**Port conflicts:**
- Change backend port in `run.py` and update frontend `.env`
- Check for processes using ports 3000/5000: `netstat -an | grep :3000`

## 📞 Support

- Create an issue on GitHub
- Check the documentation in `docs/`
- Review the FAQ section

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Flask community for the excellent web framework
- React team for the powerful frontend library
- All contributors who help improve this project

---

**Happy Collaborating! 🚀**
pip install -r requirements.txt
```

Créer un fichier `.env` dans le répertoire `backend` avec les variables suivantes :

```
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=votre-clé-secrète
JWT_SECRET_KEY=votre-clé-jwt
DATABASE_URI=sqlite:///app.db
UPLOAD_FOLDER=uploads
GCP_CREDENTIALS=path/to/your/credentials.json
GCP_BUCKET_NAME=your-bucket-name
```

### Configuration du Frontend

```bash
cd frontend
npm install
```

Créer un fichier `.env` dans le répertoire `frontend` avec les variables suivantes :

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Démarrage de l'application

### Backend

```bash
cd backend
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
python maim.py
```

Le serveur backend sera accessible à l'adresse `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm start
```

L'application frontend sera accessible à l'adresse `http://localhost:3000`.

## Tests

Pour exécuter tous les tests :

```bash
python run_tests.py --all
```

Pour exécuter des tests spécifiques :

```bash
python run_tests.py --backend  # Tests backend uniquement
python run_tests.py --frontend  # Tests frontend uniquement
python run_tests.py --integration  # Tests d'intégration uniquement
python run_tests.py --security  # Tests de sécurité uniquement
```

## Déploiement

### Backend

Pour déployer le backend sur un serveur de production :

1. Configurer un serveur avec Python et les dépendances nécessaires
2. Utiliser Gunicorn comme serveur WSGI :

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

3. Configurer Nginx comme proxy inverse

### Frontend

Pour déployer le frontend :

```bash
cd frontend
npm run build
```

Les fichiers statiques générés dans le dossier `build` peuvent être servis par n'importe quel serveur web.

## Structure du projet

```
secure-collab-platform/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── config/
│   │   ├── static/
│   │   └── templates/
│   ├── tests/
│   ├── app.py
│   ├── main.py
│   ├── create_db.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── files/
│   │   │   ├── layout/
│   │   │   └── collaboration/
│   │   ├── tests/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tailwind.config.js
├── tests/
│   ├── test_integration.py
│   └── test_security.py
├── run_tests.py
└── README.md
```

## Sécurité

Cette application implémente plusieurs mesures de sécurité :

- Hachage des mots de passe avec bcrypt
- Chiffrement AES pour les fichiers stockés
- Authentification par tokens JWT avec expiration
- Protection contre les injections SQL
- Protection contre les attaques XSS
- En-têtes de sécurité HTTP
- Journalisation des actions avec ACLs

## Licence

[MIT](LICENSE)

## Contact

Pour toute question ou suggestion, veuillez contacter [votre-email@example.com](mailto:votre-email@example.com).
