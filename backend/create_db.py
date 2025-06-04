"""
Script pour créer la structure initiale de la base de données SQLite
"""
import sqlite3
import os

def create_database():
    # Définir le chemin de la base de données
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'app.db')
    
    # Créer le répertoire si nécessaire
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Connexion à la base de données (la crée si elle n'existe pas)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
   # Créer la table des utilisateurs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'offline', -- online, offline, away
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        password_reset_token TEXT UNIQUE,
        password_reset_expires TIMESTAMP,
        google_id TEXT UNIQUE,
        mfa_secret TEXT,
        mfa_enabled BOOLEAN DEFAULT 0
    )
    ''')
    
    # Créer la table des fichiers
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        owner_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users (id)
    )
    ''')
    
    # Créer la table des partages de fichiers
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS file_shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        permission TEST DEFAULT read, --write
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Créer la table des logs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        details TEXT,
        ip_address TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Créer la table des utilisateurs actifs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS active_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_id INTEGER,
        action TEXT NOT NULL, -- viewing, editing
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (file_id) REFERENCES files (id)
    )
    ''')
    
    # Créer la table des messages
   #cursor.execute('''
# CREATE TABLE IF NOT EXISTS messages (
  #     id INTEGER PRIMARY KEY AUTOINCREMENT,
   #    file_id INTEGER NOT NULL,
    #   user_id INTEGER NOT NULL,
    #   text TEXT NOT NULL,
   #    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    #   FOREIGN KEY (file_id) REFERENCES files (id),
     #  FOREIGN KEY (user_id) REFERENCES users (id)
   #)
   #''')
    
    # Valider les changements et fermer la connexion
    conn.commit()
    conn.close()
    
    print(f"Base de données créée avec succès à {db_path}")

if __name__ == "__main__":
    create_database()