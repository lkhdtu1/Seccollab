
import unittest
from app import create_app
from app.utils.database import init_db
from app.models.user import User
from app.models.file import File
from app.models.file_share import FileShare
from app.utils.security import hash_password, check_password
import os
import tempfile
import json




class TestAuthentication(unittest.TestCase):
    def setUp(self):
        # Créer une application de test
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-key'
        
        # Initialiser la base de données
        with self.app.app_context():
            init_db(self.app)
            
            # Créer un utilisateur de test
            test_user = User(
                email='test@example.com',
                name='Test User',
                password=hash_password('SecurePassword123!')
            )
            db.session.add(test_user); db.session.commit()
        
        self.client = self.app.test_client()
    
    def tearDown(self):
        # Nettoyer après chaque test
        with self.app.app_context():
            db = init_db(self.app)
            db.session.remove()
            db.drop_all()
    
    def test_register(self):
        # Tester l'enregistrement d'un nouvel utilisateur
        response = self.client.post('/api/auth/register', json={
            'email': 'new@example.com',
            'name': 'New User',
            'password': 'SecurePassword123!'
        })
        
        self.assertEqual(response.status_code, 201)
        self.assertIn('Utilisateur créé avec succès', response.get_json()['message'])
        
        # Vérifier que l'utilisateur existe dans la base de données
        with self.app.app_context():
            user = User.query.filter_by(email='new@example.com').first()
            self.assertIsNotNone(user)
            self.assertEqual(user.name, 'New User')
    
    def test_register_existing_email(self):
        # Tester l'enregistrement avec un email déjà utilisé
        response = self.client.post('/api/auth/register', json={
            'email': 'test@example.com',
            'name': 'Another User',
            'password': 'SecurePassword123!'
        })
        
        self.assertEqual(response.status_code, 409)
        self.assertIn('Cet email est déjà utilisé', response.get_json()['message'])
    
    def test_login_success(self):
        # Tester la connexion réussie
        response = self.client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'SecurePassword123!'
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('access_token', data)
        self.assertIn('refresh_token', data)
        self.assertEqual(data['user']['email'], 'test@example.com')
    
    def test_login_wrong_password(self):
        # Tester la connexion avec un mot de passe incorrect
        response = self.client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'WrongSecurePassword123!'
        })
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('Email ou mot de passe incorrect', response.get_json()['message'])
    
    def test_login_nonexistent_user(self):
        # Tester la connexion avec un utilisateur inexistant
        response = self.client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'SecurePassword123!'
        })
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('Email ou mot de passe incorrect', response.get_json()['message'])

class TestFileOperations(unittest.TestCase):
    def setUp(self):
        # Créer une application de test
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-key'
        
        # Créer un répertoire temporaire pour les uploads
        self.upload_dir = tempfile.mkdtemp()
        self.app.config['UPLOAD_FOLDER'] = self.upload_dir
        
        # Initialiser la base de données
        with self.app.app_context():
            init_db(self.app)
            
            # Créer un utilisateur de test
            test_user = User(
                email='test@example.com',
                name='Test User',
                password=hash_password('SecurePassword123!')
            )
            db.session.add(test_user); db.session.commit()
            
            # Créer un autre utilisateur pour les tests de partage
            other_user = User(
                email='other@example.com',
                name='Other User',
                password=hash_password('SecurePassword123!')
            )
            db.session.add(other_user); db.session.commit()
            
            # Créer un fichier de test
            test_file = File(
                name='test_file.txt',
                storage_path='user_1/test_file.txt',
                size=1024,
                mime_type='text/plain',
                owner_id=test_user.id
            )
            db.session.add(test_file); db.session.commit()
        
        self.client = self.app.test_client()
        
        # Se connecter et obtenir un token
        response = self.client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'SecurePassword123!'
        })
        self.token = response.get_json()['access_token']
    
    def tearDown(self):
        # Nettoyer après chaque test
        with self.app.app_context():
            db = init_db(self.app)
            db.session.remove()
            db.drop_all()
        
        # Supprimer le répertoire temporaire
        import shutil
        shutil.rmtree(self.upload_dir)
    
    def test_list_files(self):
        # Tester la récupération de la liste des fichiers
        response = self.client.get('/api/files/list', headers={
            'Authorization': f'Bearer {self.token}'
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('owned', data)
        self.assertEqual(len(data['owned']), 1)
        self.assertEqual(data['owned'][0]['name'], 'test_file.txt')
    
    def test_share_file(self):
        # Tester le partage d'un fichier
        with self.app.app_context():
            file = File.query.first()
            other_user = User.query.filter_by(email='other@example.com').first()
            
            response = self.client.post('/api/files/share', json={
                'file_id': file.id,
                'email': other_user.email
            }, headers={
                'Authorization': f'Bearer {self.token}'
            })
            
            self.assertEqual(response.status_code, 201)
            self.assertIn('Fichier partagé avec succès', response.get_json()['message'])
            
            # Vérifier que le partage existe dans la base de données
            share = FileShare.query.filter_by(file_id=file.id, user_id=other_user.id).first()
            self.assertIsNotNone(share)
    
    def test_unauthorized_share(self):
        # Se connecter avec l'autre utilisateur
        response = self.client.post('/api/auth/login', json={
            'email': 'other@example.com',
            'password': 'SecurePassword123!'
        })
        other_token = response.get_json()['access_token']
        
        # Tenter de partager un fichier qui ne nous appartient pas
        with self.app.app_context():
            file = File.query.first()
            
            response = self.client.post('/api/files/share', json={
                'file_id': file.id,
                'email': 'test@example.com'
            }, headers={
                'Authorization': f'Bearer {other_token}'
            })
            
            self.assertEqual(response.status_code, 403)
            self.assertIn('Vous n\'êtes pas autorisé', response.get_json()['message'])

class TestSecurity(unittest.TestCase):
    def setUp(self):
        # Créer une application de test
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-key'
        
        # Initialiser la base de données
        with self.app.app_context():
            init_db(self.app)
            
            # Créer un utilisateur de test
            test_user = User(
                email='test@example.com',
                name='Test User',
                password=hash_password('SecurePassword123!')
            )
            db.session.add(test_user); db.session.commit()
        
        self.client = self.app.test_client()
        
        # Se connecter et obtenir un token
        response = self.client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'SecurePassword123!'
        })
        self.token = response.get_json()['access_token']
    
    def tearDown(self):
        # Nettoyer après chaque test
        with self.app.app_context():
            db = init_db(self.app)
            db.session.remove()
            db.drop_all()
    
    def test_password_hashing(self):
        # Tester le hachage des mots de passe
        password = 'SecurePassword123!'
        hashed = hash_password(password)
        
        # Vérifier que le mot de passe est correctement haché
        self.assertNotEqual(password, hashed)
        self.assertTrue(check_password(password, hashed))
        self.assertFalse(check_password('WrongPassword', hashed))
    
    def test_token_verification(self):
        # Tester la vérification des tokens
        response = self.client.get('/api/token/verify', headers={
            'Authorization': f'Bearer {self.token}'
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['valid'])
    
    def test_invalid_token(self):
        # Tester un token invalide
        response = self.client.get('/api/token/verify', headers={
            'Authorization': 'Bearer invalid-token'
        })
        
        self.assertEqual(response.status_code, 422)  # Unprocessable Entity pour un token mal formé
    
    def test_password_policy(self):
        # Tester la politique de mot de passe
        response = self.client.get('/api/security/password-policy')
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['requires_uppercase'])
        self.assertTrue(data['requires_lowercase'])
        self.assertTrue(data['requires_digit'])
        self.assertTrue(data['requires_special_char'])
    
    def test_validate_password(self):
        # Tester la validation des mots de passe
        # Mot de passe valide
        response = self.client.post('/api/security/validate-password', json={
            'password': 'SecurePassword123!'
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()['valid'])
        
        # Mot de passe invalide (pas de majuscule)
        response = self.client.post('/api/security/validate-password', json={
            'password': 'SecurePassword123!'
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.get_json()['valid'])
        
        # Mot de passe invalide (pas de chiffre)
        response = self.client.post('/api/security/validate-password', json={
            'password': 'Password!'
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.get_json()['valid'])

if __name__ == '__main__':
    unittest.main()
