from cryptography.fernet import Fernet
import os
from app.config.config import Config
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Clé de chiffrement principale (dans un environnement de production, cette clé devrait être stockée de manière sécurisée)
# Pour simplifier, nous utilisons une clé fixe ici, mais en production, elle devrait être stockée dans un coffre-fort ou une variable d'environnement
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY') or 'clé-de-chiffrement-par-défaut-à-changer-en-production'

def derive_key(key_material, salt=None):
    """
    Dérive une clé de chiffrement à partir d'un matériel de clé et d'un sel optionnel.
    
    Args:
        key_material (str): Le matériel de clé (mot de passe ou clé principale)
        salt (bytes, optional): Le sel à utiliser pour la dérivation
        
    Returns:
        tuple: (clé dérivée, sel utilisé)
    """
    if salt is None:
        salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    
    key = base64.urlsafe_b64encode(kdf.derive(key_material.encode()))
    return key, salt

def encrypt_file(file_path):
    """
    Chiffre un fichier en utilisant AES (via Fernet).
    
    Args:
        file_path (str): Chemin du fichier à chiffrer
        
    Returns:
        str: Chemin du fichier chiffré
    """
    # Dériver une clé de chiffrement
    key, salt = derive_key(ENCRYPTION_KEY)
    
    # Créer un objet Fernet avec la clé dérivée
    fernet = Fernet(key)
    
    # Lire le contenu du fichier
    with open(file_path, 'rb') as file:
        file_data = file.read()
    
    # Chiffrer les données
    encrypted_data = fernet.encrypt(file_data)
    
    # Préparer les données à écrire (sel + données chiffrées)
    data_to_write = salt + encrypted_data
    
    # Écrire les données chiffrées dans un nouveau fichier
    encrypted_path = f"{file_path}.enc"
    with open(encrypted_path, 'wb') as file:
        file.write(data_to_write)
    
    return encrypted_path

def decrypt_file(encrypted_path):
    """
    Déchiffre un fichier chiffré avec encrypt_file.
    
    Args:
        encrypted_path (str): Chemin du fichier chiffré
        
    Returns:
        str: Chemin du fichier déchiffré
    """
    # Lire le contenu du fichier chiffré
    with open(encrypted_path, 'rb') as file:
        data = file.read()
    
    # Extraire le sel et les données chiffrées
    salt = data[:16]
    encrypted_data = data[16:]
    
    # Dériver la clé de chiffrement avec le sel extrait
    key, _ = derive_key(ENCRYPTION_KEY, salt)
    
    # Créer un objet Fernet avec la clé dérivée
    fernet = Fernet(key)
    
    # Déchiffrer les données
    decrypted_data = fernet.decrypt(encrypted_data)
    
    # Écrire les données déchiffrées dans un nouveau fichier
    decrypted_path = encrypted_path[:-4]  # Supprimer l'extension .enc
    if os.path.exists(decrypted_path):
        # Si le fichier existe déjà, créer un nouveau nom
        base, ext = os.path.splitext(decrypted_path)
        decrypted_path = f"{base}_decrypted{ext}"
    
    with open(decrypted_path, 'wb') as file:
        file.write(decrypted_data)
    
    return decrypted_path
