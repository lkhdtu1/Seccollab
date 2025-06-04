from flask import Flask, jsonify
from flask_cors import CORS
from app.utils.database import init_db, db
from app.utils.init_storage import init_storage
from sqlalchemy.sql import text  # Import the text function




def create_app():
    """
    Create and configure the Flask application.
    """
    app = Flask(__name__)

    # Configure the database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize the database
    init_db(app)

    # Enable CORS for development
    CORS(app)
    return app


# Create the Flask app
app = create_app()


@app.route('/')
def home():
    """
    Home route to verify the app is running.
    """
    return 'Hello World! Flask is running.'



@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "Hello from Flask !"})




@app.route('/test-db', methods=['GET'])
def test_db():
    """
    Test API to check database connectivity.
    """
    try:
        # Query the database to check connectivity
        results = db.session.execute(text('SELECT * FROM users LIMIT 1')).fetchall()
        
        # Convert rows to dictionaries
        data = [dict(row._mapping) for row in results]  # Use _mapping to access row data as a dictionary
        return jsonify({'status': 'success', 'data': data})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})


if __name__ == '__main__':
    # Initialize storage (if required)
    storage_initialized = init_storage()
    if not storage_initialized:
        print("AVERTISSEMENT: L'initialisation du stockage a échoué, certaines fonctionnalités peuvent ne pas fonctionner correctement")

    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)



