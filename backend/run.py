from app import create_app
from app.utils.database import init_db
import os

app = create_app()
db = init_db(app)

# Créer les répertoires nécessaires pour le stockage
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER']), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'temp'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'storage'), exist_ok=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
