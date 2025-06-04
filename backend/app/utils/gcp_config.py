import os
from google.cloud import storage
from google.oauth2 import service_account
import json

# Configuration pour GCP
class GCPConfig:
    def __init__(self):
        self.bucket_name = os.environ.get('GCP_BUCKET_NAME', 'secure-collab-platform-bucket')
        self.credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', None)
        
        # Créer un fichier de configuration simulé pour GCP si nécessaire
        if not self.credentials_path:
            self.credentials_path = self._create_mock_credentials()
    
    def _create_mock_credentials(self):
        """Crée un fichier de credentials simulé pour le développement local"""
        creds_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'config')
        os.makedirs(creds_dir, exist_ok=True)
        
        creds_path = os.path.join(creds_dir, 'gcp-credentials.json')
        
        # Créer un fichier de credentials simulé
        mock_creds = {
            "type": "service_account",
            "project_id": "secure-collab-platform",
            "private_key_id": "mock-key-id",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
            "client_email": "mock-service-account@secure-collab-platform.iam.gserviceaccount.com",
            "client_id": "123456789",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/mock-service-account%40secure-collab-platform.iam.gserviceaccount.com"
        }
        
        with open(creds_path, 'w') as f:
            json.dump(mock_creds, f)
        
        return creds_path
    
    

    def get_storage_client(self):
        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path
            )
            return storage.Client(credentials=credentials)
        except Exception as e:
            print(f"Erreur lors de la création du client GCP: {str(e)}")
            return None


    
    
    '''
    def get_storage_client(self):
        """
        Retourne un client GCP Storage.
        En développement, utilise des credentials simulées.
        En production, utiliserait les credentials réelles.
        """
        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path
            )
            return storage.Client(credentials=credentials)
        except Exception as e:
            print(f"Erreur lors de la création du client GCP: {str(e)}")
            # En cas d'erreur, retourner None pour permettre la gestion de l'erreur
            return None
    '''
    def ensure_bucket_exists(self):
        """
        S'assure que le bucket GCP existe.
        En développement, simule cette vérification.
        En production, créerait réellement le bucket si nécessaire.
        """
        client = self.get_storage_client()
        if not client:
            print("Impossible de créer le client GCP, utilisation du stockage local uniquement")
            return False
        
        try:
            bucket = client.bucket(self.bucket_name)
            if not bucket.exists():
                bucket = client.create_bucket(self.bucket_name)
                print(f"Bucket {self.bucket_name} créé avec succès")
            else:
                print(f"Bucket {self.bucket_name} existe déjà")
            return True
        except Exception as e:
            print(f"Erreur lors de la vérification/création du bucket: {str(e)}")
            return False

# Initialiser la configuration GCP
gcp_config = GCPConfig()
