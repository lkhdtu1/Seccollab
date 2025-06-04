import bcrypt

def hash_password(password):
    """
    Hache un mot de passe en utilisant bcrypt.
    
    Args:
        password (str): Le mot de passe en clair à hacher
        
    Returns:
        str: Le mot de passe haché
    """
    # Générer un sel et hacher le mot de passe
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)  # 12 rounds est recommandé pour la sécurité
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Retourner le hash en format string
    return hashed.decode('utf-8')

def check_password(password, hashed_password):
    """
    Vérifie si un mot de passe correspond à un hash.
    
    Args:
        password (str): Le mot de passe en clair à vérifier
        hashed_password (str): Le hash du mot de passe stocké
        
    Returns:
        bool: True si le mot de passe correspond, False sinon
    """
    password_bytes = password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    
    # Vérifier le mot de passe
    return bcrypt.checkpw(password_bytes, hashed_bytes)
