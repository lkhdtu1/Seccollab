import os
from werkzeug.utils import secure_filename
from flask import current_app
from datetime import datetime
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'webm', 'mov', 'avi', 'mkv'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_file(file):
    try:
        if not allowed_file(file.filename):
            raise ValueError('File type not allowed')
            
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        
        upload_folder = os.path.join(current_app.root_path, 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Return URL path relative to upload folder
        return f'/uploads/{unique_filename}'
        
    except Exception as e:
        current_app.logger.error(f"File upload error: {str(e)}")
        raise