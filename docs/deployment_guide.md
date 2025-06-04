# Déploiement de la Plateforme Collaborative Sécurisée

Ce document explique comment déployer la Plateforme Collaborative Sécurisée dans différents environnements.

## Table des matières

1. [Déploiement avec Docker](#déploiement-avec-docker)
2. [Déploiement manuel](#déploiement-manuel)
3. [Configuration pour la production](#configuration-pour-la-production)
4. [Mise à jour de l'application](#mise-à-jour-de-lapplication)
5. [Sauvegarde et restauration](#sauvegarde-et-restauration)

## Déploiement avec Docker

Le moyen le plus simple de déployer l'application est d'utiliser Docker et Docker Compose.

### Prérequis

- Docker Engine (version 19.03.0+)
- Docker Compose (version 1.27.0+)
- Git

### Étapes de déploiement

1. Cloner le dépôt :

```bash
git clone https://github.com/votre-utilisateur/secure-collab-platform.git
cd secure-collab-platform
```

2. Configurer les variables d'environnement :

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
# Variables pour le backend
SECRET_KEY=votre-clé-secrète-très-longue-et-aléatoire
JWT_SECRET_KEY=votre-clé-jwt-très-longue-et-aléatoire
GCP_BUCKET_NAME=votre-bucket-gcp

# Variables pour le frontend
REACT_APP_API_URL=http://localhost:5000/api
```

3. Démarrer les conteneurs :

```bash
docker-compose up -d
```

4. Initialiser la base de données :

```bash
docker-compose exec backend python create_db.py
```

5. Accéder à l'application :

L'application est maintenant accessible à l'adresse `http://localhost:3000`.

### Arrêt des conteneurs

Pour arrêter l'application :

```bash
docker-compose down
```

## Déploiement manuel

Si vous préférez déployer l'application sans Docker, suivez ces étapes.

### Prérequis

- Python 3.8+
- Node.js 14+
- npm ou yarn
- Git
- Serveur web (Nginx recommandé)

### Déploiement du backend

1. Cloner le dépôt :

```bash
git clone https://github.com/votre-utilisateur/secure-collab-platform.git
cd secure-collab-platform
```

2. Configurer l'environnement Python :

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install gunicorn
```

3. Configurer les variables d'environnement :

Créez un fichier `.env` dans le répertoire `backend` avec les variables appropriées.

4. Initialiser la base de données :

```bash
python create_db.py
```

5. Démarrer le serveur avec Gunicorn :

```bash
gunicorn --bind 0.0.0.0:5000 app:app
```

### Déploiement du frontend

1. Installer les dépendances :

```bash
cd frontend
npm install
```

2. Configurer les variables d'environnement :

Créez un fichier `.env` dans le répertoire `frontend` avec les variables appropriées.

3. Construire l'application :

```bash
npm run build
```

4. Configurer Nginx :

Créez un fichier de configuration Nginx pour servir les fichiers statiques et rediriger les requêtes API vers le backend.

5. Redémarrer Nginx :

```bash
sudo systemctl restart nginx
```

## Configuration pour la production

Pour un déploiement en production, des configurations supplémentaires sont nécessaires.

### Sécurité

1. Utiliser HTTPS :
   - Obtenir un certificat SSL (Let's Encrypt est gratuit)
   - Configurer Nginx pour utiliser HTTPS

2. Sécuriser les clés :
   - Utiliser un gestionnaire de secrets comme HashiCorp Vault
   - Ne jamais stocker les clés dans le code source

3. Pare-feu :
   - Configurer un pare-feu pour limiter l'accès aux ports nécessaires
   - Utiliser des groupes de sécurité si vous déployez sur le cloud

### Base de données

Pour une utilisation en production, il est recommandé de migrer vers une base de données plus robuste :

1. PostgreSQL :
   - Installer PostgreSQL
   - Modifier la variable `DATABASE_URI` pour pointer vers PostgreSQL
   - Exécuter les migrations

2. Sauvegardes :
   - Configurer des sauvegardes automatiques quotidiennes
   - Tester régulièrement la restauration des sauvegardes

### Stockage

Pour le stockage en production :

1. Configurer correctement GCP :
   - Créer un compte de service avec les permissions minimales nécessaires
   - Stocker les credentials de manière sécurisée

2. Configurer les règles de cycle de vie :
   - Définir des règles pour l'archivage ou la suppression des fichiers anciens si nécessaire

## Mise à jour de l'application

### Mise à jour avec Docker

1. Arrêter les conteneurs :

```bash
docker-compose down
```

2. Mettre à jour le code source :

```bash
git pull
```

3. Reconstruire et redémarrer les conteneurs :

```bash
docker-compose up -d --build
```

### Mise à jour manuelle

1. Arrêter les services :

```bash
# Arrêter Gunicorn et Nginx
sudo systemctl stop nginx
```

2. Mettre à jour le code source :

```bash
git pull
```

3. Mettre à jour les dépendances :

```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run build
```

4. Redémarrer les services :

```bash
# Démarrer Gunicorn et Nginx
sudo systemctl start nginx
```

## Sauvegarde et restauration

### Sauvegarde

1. Base de données :

```bash
# Pour SQLite
cp backend/app.db backend/app.db.backup

# Pour PostgreSQL
pg_dump -U username -d database_name > backup.sql
```

2. Fichiers utilisateur :

```bash
# Sauvegarder le répertoire des uploads
tar -czf uploads_backup.tar.gz uploads/
```

3. Configuration :

```bash
# Sauvegarder les fichiers de configuration
cp .env .env.backup
cp docker-compose.yml docker-compose.yml.backup
```

### Restauration

1. Base de données :

```bash
# Pour SQLite
cp backend/app.db.backup backend/app.db

# Pour PostgreSQL
psql -U username -d database_name < backup.sql
```

2. Fichiers utilisateur :

```bash
# Restaurer le répertoire des uploads
tar -xzf uploads_backup.tar.gz
```

3. Configuration :

```bash
# Restaurer les fichiers de configuration
cp .env.backup .env
cp docker-compose.yml.backup docker-compose.yml
```
