from app.utils.gcp_config import gcp_config
import os
from app.config.config import Config



'''
def init_storage():
    #from app.utils import gcp_config
    client = gcp_config.get_storage_client()  # <== APPEL direct ici
    if client:
        return gcp_config.ensure_bucket_exists()
    return False

'''
def init_storage():
    """
    Initialise le stockage pour l'application.
    Crée les répertoires locaux nécessaires et configure l'intégration avec GCP.
    
    Returns:
        bool: True si l'initialisation a réussi, False sinon
    """
    try:
        # Créer les répertoires locaux pour le stockage
        upload_folder = Config.UPLOAD_FOLDER
        os.makedirs(upload_folder, exist_ok=True)
        os.makedirs(os.path.join(upload_folder, 'temp'), exist_ok=True)
        os.makedirs(os.path.join(upload_folder, 'storage'), exist_ok=True)
        
        # Initialiser l'intégration avec GCP
        gcp_initialized = gcp_config.ensure_bucket_exists()
        
        if gcp_initialized:
            print("Intégration GCP initialisée avec succès")
        else:
            print("Utilisation du stockage local uniquement (mode développement)")
        
        return True
    except Exception as e:
        print(f"Erreur lors de l'initialisation du stockage: {str(e)}")
        return False
