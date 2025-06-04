import os
import secrets
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import base64

class SecurityManager:
    """
    Gestionnaire centralisé pour les fonctionnalités de sécurité de l'application.
    Gère le chiffrement AES, la génération de clés sécurisées et les opérations cryptographiques.
    """
    
    def __init__(self):
        # Clé maître pour le chiffrement (en production, devrait être stockée de manière sécurisée)
        self.master_key = os.environ.get('MASTER_KEY') or 'clé-maître-par-défaut-à-changer-en-production'
        
        # Sel pour la dérivation de clé (en production, devrait être stocké de manière sécurisée)
        self.master_salt = os.environ.get('MASTER_SALT') or secrets.token_bytes(16)
        
        # Dériver la clé de chiffrement principale
        self.encryption_key = self._derive_key(self.master_key, self.master_salt)
        
        # Créer un objet Fernet avec la clé dérivée
        self.fernet = Fernet(self.encryption_key)
    
    def _derive_key(self, key_material, salt):
        """
        Dérive une clé cryptographique à partir d'un matériel de clé et d'un sel.
        
        Args:
            key_material (str): Le matériel de clé (mot de passe ou clé principale)
            salt (bytes): Le sel à utiliser pour la dérivation
            
        Returns:
            bytes: La clé dérivée encodée en base64 URL-safe
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(key_material.encode()))
        return key
    
    def encrypt_data(self, data):
        """
        Chiffre des données avec AES (via Fernet).
        
        Args:
            data (bytes or str): Les données à chiffrer
            
        Returns:
            bytes: Les données chiffrées
        """
        if isinstance(data, str):
            data = data.encode('utf-8')
        
        return self.fernet.encrypt(data)
    
    def decrypt_data(self, encrypted_data):
        """
        Déchiffre des données chiffrées avec encrypt_data.
        
        Args:
            encrypted_data (bytes): Les données chiffrées
            
        Returns:
            bytes: Les données déchiffrées
        """
        return self.fernet.decrypt(encrypted_data)
    
    def generate_secure_token(self, length=32):
        """
        Génère un token cryptographiquement sécurisé.
        
        Args:
            length (int): La longueur du token en octets
            
        Returns:
            str: Le token généré en hexadécimal
        """
        return secrets.token_hex(length)
    
    def hash_with_pepper(self, data, pepper=None):
        """
        Hache des données avec un poivre (pepper) pour une sécurité supplémentaire.
        
        Args:
            data (str): Les données à hacher
            pepper (str, optional): Le poivre à utiliser
            
        Returns:
            bytes: Les données hachées
        """
        if pepper is None:
            pepper = os.environ.get('PEPPER') or 'poivre-par-défaut-à-changer-en-production'
        
        # Combiner les données avec le poivre
        peppered_data = (data + pepper).encode('utf-8')
        
        # Hacher les données
        digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
        digest.update(peppered_data)
        
        return digest.finalize()

# Créer une instance du gestionnaire de sécurité
security_manager = SecurityManager()
