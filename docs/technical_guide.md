# Guide technique - Plateforme Collaborative Sécurisée

Ce guide technique détaille l'architecture, les composants et les mécanismes de sécurité de la Plateforme Collaborative Sécurisée pour les développeurs et administrateurs système.

## Architecture globale

L'application suit une architecture client-serveur avec séparation claire entre le frontend et le backend :

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Client React   │◄────►│  API Flask      │◄────►│  Base de données│
│  (Frontend)     │      │  (Backend)      │      │  SQLite         │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 ▲
                                 │
                                 ▼
                         ┌─────────────────┐
                         │                 │
                         │  Stockage GCP   │
                         │                 │
                         └─────────────────┘
```

## Composants du Frontend

### Structure des composants React

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ProtectedRoute.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   └── DashboardStats.tsx
│   ├── files/
│   │   ├── FileShare.tsx
│   │   ├── AdvancedSearch.tsx
│   │   └── PermissionsManager.tsx
│   ├── layout/
│   │   └── Navbar.tsx
│   └── collaboration/
│       ├── RealtimeCollaboration.tsx
│       └── CollaborationHub.tsx
├── App.tsx
└── index.tsx
```

### Flux de données

1. Les composants React font des requêtes aux API du backend via Axios
2. Les réponses sont traitées et stockées dans l'état local des composants ou dans le localStorage
3. Les mises à jour de l'interface utilisateur sont déclenchées par les changements d'état

### Gestion de l'authentification côté client

- Les tokens JWT sont stockés dans le localStorage
- Un intercepteur Axios ajoute automatiquement le token à chaque requête
- Les routes protégées vérifient la présence et la validité du token

## Composants du Backend

### Structure de l'API Flask

```
app/
├── routes/
│   ├── auth.py
│   ├── files.py
│   ├── users.py
│   ├── oauth.py
│   ├── token.py
│   ├── admin.py
│   ├── security.py
│   ├── audit.py
│   └── collaboration.py
├── models/
│   ├── user.py
│   ├── file.py
│   └── file_share.py
├── utils/
│   ├── security.py
│   ├── encryption.py
│   ├── storage.py
│   ├── logging.py
│   ├── database.py
│   ├── security_manager.py
│   └── gcp_config.py
└── config/
    └── config.py
```

### Points d'API principaux

| Endpoint | Méthode | Description | Authentification requise |
|----------|---------|-------------|--------------------------|
| `/api/auth/register` | POST | Inscription d'un nouvel utilisateur | Non |
| `/api/auth/login` | POST | Connexion d'un utilisateur | Non |
| `/api/oauth/google/login` | GET | Initier l'authentification OAuth2 avec Google | Non |
| `/api/files/list` | GET | Lister les fichiers de l'utilisateur | Oui |
| `/api/files/upload` | POST | Téléverser un fichier | Oui |
| `/api/files/download/{id}` | GET | Télécharger un fichier | Oui |
| `/api/files/share` | POST | Partager un fichier | Oui |
| `/api/token/verify` | GET | Vérifier la validité d'un token | Oui |
| `/api/token/refresh` | POST | Rafraîchir un token d'accès | Oui (refresh token) |
| `/api/security/password-policy` | GET | Obtenir la politique de mot de passe | Non |
| `/api/admin/logs` | GET | Obtenir les logs système | Oui (admin) |

### Modèles de données

#### Utilisateur (User)
- id: Integer (PK)
- email: String (unique)
- name: String
- password: String (hashed)
- created_at: DateTime
- updated_at: DateTime

#### Fichier (File)
- id: Integer (PK)
- name: String
- storage_path: String
- size: Integer
- mime_type: String
- owner_id: Integer (FK -> User.id)
- created_at: DateTime
- updated_at: DateTime

#### Partage de fichier (FileShare)
- id: Integer (PK)
- file_id: Integer (FK -> File.id)
- user_id: Integer (FK -> User.id)
- created_at: DateTime

#### Log
- id: Integer (PK)
- action: String
- user_id: Integer (FK -> User.id)
- details: String
- timestamp: DateTime

## Mécanismes de sécurité

### Authentification

#### JWT (JSON Web Tokens)
- Génération de tokens d'accès et de rafraîchissement
- Expiration configurable des tokens
- Stockage des JTI (JWT ID) révoqués

#### OAuth2
- Intégration avec Google pour l'authentification externe
- Vérification des informations de profil
- Création automatique de compte si nécessaire

#### Authentification à deux facteurs (2FA)
- Implémentation basée sur TOTP (Time-based One-Time Password)
- QR code pour configuration facile avec des applications comme Google Authenticator

### Chiffrement et hachage

#### Hachage des mots de passe
- Utilisation de bcrypt avec sel aléatoire
- Facteur de coût configurable

#### Chiffrement des fichiers
- Chiffrement AES-256 en mode GCM
- Dérivation de clé avec PBKDF2
- Chiffrement côté serveur avant stockage

#### Gestionnaire de sécurité centralisé
- Dérivation de clés sécurisée
- Gestion des opérations cryptographiques
- Génération de tokens sécurisés

### Contrôle d'accès

#### Middleware d'authentification
- Vérification des tokens JWT pour chaque requête protégée
- Extraction de l'identité de l'utilisateur

#### Vérification des permissions
- Contrôle d'accès basé sur les rôles (RBAC)
- Vérification de propriété pour les fichiers
- Vérification des partages pour l'accès aux fichiers

### Journalisation et audit

#### Système de logs
- Journalisation de toutes les actions sensibles
- Stockage des logs en base de données avec ACLs
- Horodatage précis des événements

#### Fonctionnalités d'audit
- Historique d'activité par utilisateur
- Historique d'activité par fichier
- Filtrage et recherche dans les logs

### Protection contre les attaques courantes

#### Injections SQL
- Utilisation de SQLAlchemy avec requêtes paramétrées
- Validation des entrées utilisateur

#### Cross-Site Scripting (XSS)
- Échappement des données affichées
- En-têtes de sécurité Content-Security-Policy

#### Cross-Site Request Forgery (CSRF)
- Tokens JWT avec vérification d'origine
- Validation des requêtes sensibles

#### En-têtes de sécurité HTTP
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security

## Stockage des fichiers

### Stockage local (développement)
- Stockage des fichiers dans un répertoire configurable
- Structure de répertoires basée sur l'ID utilisateur

### Google Cloud Storage (production)
- Stockage des fichiers dans des buckets GCP
- Chiffrement côté serveur avant téléversement
- Gestion des métadonnées pour le suivi des fichiers

## Configuration et déploiement

### Variables d'environnement

#### Backend
- `FLASK_APP`: Nom du fichier d'application Flask
- `FLASK_ENV`: Environnement (development, production)
- `SECRET_KEY`: Clé secrète pour Flask
- `JWT_SECRET_KEY`: Clé secrète pour les tokens JWT
- `DATABASE_URI`: URI de connexion à la base de données
- `UPLOAD_FOLDER`: Chemin du dossier de téléversement local
- `GCP_CREDENTIALS`: Chemin vers le fichier de credentials GCP
- `GCP_BUCKET_NAME`: Nom du bucket GCP pour le stockage
- `MASTER_KEY`: Clé maître pour le chiffrement (production uniquement)
- `MASTER_SALT`: Sel pour la dérivation de clé (production uniquement)
- `PEPPER`: Poivre pour le hachage (production uniquement)

#### Frontend
- `REACT_APP_API_URL`: URL de l'API backend

### Déploiement en production

#### Backend
1. Configurer un serveur avec Python 3.8+
2. Installer les dépendances : `pip install -r requirements.txt`
3. Configurer les variables d'environnement
4. Utiliser Gunicorn comme serveur WSGI : `gunicorn -w 4 -b 0.0.0.0:5000 app:app`
5. Configurer Nginx comme proxy inverse

#### Frontend
1. Construire l'application : `npm run build`
2. Déployer les fichiers statiques sur un serveur web
3. Configurer le serveur web pour rediriger les routes vers index.html

#### Base de données
Pour une utilisation en production, il est recommandé de migrer vers une base de données plus robuste comme PostgreSQL ou MySQL.

#### Sécurité en production
- Utiliser HTTPS avec des certificats valides
- Stocker les clés secrètes dans un gestionnaire de secrets
- Configurer des sauvegardes régulières
- Mettre en place une surveillance des logs

## Maintenance et surveillance

### Surveillance des performances
- Temps de réponse des API
- Utilisation des ressources serveur
- Taille de la base de données

### Surveillance de la sécurité
- Tentatives de connexion échouées
- Activités suspectes
- Accès non autorisés

### Sauvegardes
- Sauvegarde quotidienne de la base de données
- Sauvegarde des fichiers utilisateur
- Vérification régulière de la restauration

### Mises à jour
- Mises à jour de sécurité régulières
- Gestion des dépendances
- Tests de régression après mise à jour
