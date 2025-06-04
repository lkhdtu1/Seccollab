# 👨‍💻 Development Guide

This guide covers development workflows, coding standards, and contribution guidelines for the SecureCollab Platform.

## 🏗️ Project Architecture

### Backend Architecture
```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── models/              # Database models
│   │   ├── user.py         # User model with auth
│   │   ├── file.py         # File management
│   │   └── ...
│   ├── routes/              # API endpoints
│   │   ├── auth.py         # Authentication routes
│   │   ├── files.py        # File management routes
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── auth.py         # Auth helpers
│   │   ├── encryption.py   # Encryption utilities
│   │   └── ...
│   └── config/              # Configuration files
├── migrations/              # Database migrations
├── tests/                   # Test files
└── requirements.txt         # Python dependencies
```

### Frontend Architecture
```
frontend/src/
├── components/              # React components
│   ├── Auth/               # Authentication components
│   ├── Dashboard/          # Dashboard components
│   ├── FileManager/        # File management
│   └── ...
├── contexts/               # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   ├── ThemeContext.tsx   # Theme management
│   └── ...
├── utils/                  # Utility functions
├── types/                  # TypeScript type definitions
└── hooks/                  # Custom React hooks
```

## 🛠️ Development Setup

### Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd secure-collab-platform

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies

# Frontend setup
cd ../frontend
npm install
```

### Development Tools

#### Backend Tools
```bash
# Code formatting
pip install black isort flake8

# Format code
black .
isort .

# Linting
flake8 .

# Type checking
pip install mypy
mypy app/
```

#### Frontend Tools
```bash
# ESLint and Prettier
npm install --save-dev eslint prettier

# Format code
npm run format

# Linting
npm run lint
```

## 🔄 Development Workflow

### 1. Feature Development

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Backend Development**
```bash
cd backend
source venv/bin/activate

# Make changes
# Run tests
pytest

# Check code quality
black .
flake8 .
```

3. **Frontend Development**
```bash
cd frontend

# Make changes
# Run tests
npm test

# Check code quality
npm run lint
npm run format
```

4. **Commit Changes**
```bash
git add .
git commit -m "feat: add your feature description"
```

### 2. Testing

#### Backend Testing
```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

#### Frontend Testing
```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

#### Integration Testing
```bash
# Run integration tests
python tests/test_integration.py

# Run security tests
python tests/test_security.py
```

### 3. Database Migrations

```bash
cd backend
source venv/bin/activate

# Create migration
flask db migrate -m "Description of changes"

# Apply migration
flask db upgrade

# Downgrade migration
flask db downgrade
```

## 📝 Coding Standards

### Backend (Python)

#### Code Style
- Follow PEP 8
- Use Black for formatting
- Maximum line length: 88 characters
- Use type hints where possible

```python
# Good example
def get_user_by_id(user_id: int) -> Optional[User]:
    """Get user by ID with error handling."""
    try:
        return User.query.get(user_id)
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        return None
```

#### Error Handling
```python
# Use specific exceptions
try:
    user = User.query.get(user_id)
    if not user:
        raise UserNotFoundError(f"User {user_id} not found")
except SQLAlchemyError as e:
    logger.error(f"Database error: {e}")
    raise DatabaseError("Failed to fetch user")
```

#### API Response Format
```python
# Consistent API responses
def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    }), status_code

def error_response(message="Error", status_code=400, error_code=None):
    return jsonify({
        "success": False,
        "message": message,
        "error_code": error_code
    }), status_code
```

### Frontend (TypeScript/React)

#### Component Structure
```tsx
// Good component structure
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

const MyComponent: React.FC<Props> = ({ title, onSubmit }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="component-container">
      <h1>{title}</h1>
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

#### State Management
```tsx
// Use context for global state
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Custom hooks for logic
const useApi = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Implementation...

  return { data, loading, error };
};
```

## 🚀 Deployment

### Development Deployment
```bash
# Backend
cd backend
source venv/bin/activate
export FLASK_ENV=development
python run.py

# Frontend
cd frontend
npm start
```

### Production Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy backend with gunicorn
cd backend
source venv/bin/activate
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Docker Deployment
```bash
# Build and run
docker-compose up --build

# Production mode
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Debugging

### Backend Debugging
```python
# Add debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Use Flask debugger
app.run(debug=True)

# Add breakpoints
import pdb; pdb.set_trace()
```

### Frontend Debugging
```tsx
// Console debugging
console.log('Debug info:', data);

// React DevTools
// Install React Developer Tools extension

// Network debugging
// Use browser dev tools Network tab
```

## 📋 Commit Guidelines

### Commit Message Format
```
type(scope): subject

body

footer
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples
```bash
git commit -m "feat(auth): add two-factor authentication"
git commit -m "fix(api): resolve user registration validation"
git commit -m "docs: update API documentation"
```

## 🔒 Security Considerations

### Backend Security
- Always validate input data
- Use parameterized queries
- Implement rate limiting
- Hash passwords with bcrypt
- Use HTTPS in production

### Frontend Security
- Sanitize user input
- Validate on both client and server
- Use secure HTTP headers
- Implement CSP policies

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Write tests
5. Update documentation
6. Submit pull request

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

---

**Happy Development! 🚀**
