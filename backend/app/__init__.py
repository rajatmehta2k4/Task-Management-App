
from flask import Flask
from flask_cors import CORS  # Allows our Next.js frontend to talk to Flask
import os
from dotenv import load_dotenv  # Reads our .env file

# Load environment variables from .env file into os.environ
load_dotenv()

def create_app():
    """
    Factory function that creates and configures the Flask app.
    Using a factory function (instead of creating app at module level)
    makes testing easier and avoids circular import problems.
    """
    app = Flask(__name__)
    
    # Secret key is used by Flask to sign session cookies securely
    app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-change-in-production')
    
    # CORS = Cross-Origin Resource Sharing
    # Browsers block requests from different domains by default.
    # This tells Flask to allow requests from our Next.js frontend URL.
    CORS(app, origins=[
    os.environ.get('FRONTEND_URL', 'http://localhost:3000'),
    'http://localhost:3000',
], supports_credentials=True)
    # supports_credentials=True allows cookies/auth headers to be sent
    
    # Register blueprints (groups of related routes)
    # Blueprints let us split routes into multiple files
    from app.auth import auth_bp
    from app.tasks import tasks_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    # All auth routes will start with /api/auth (e.g. /api/auth/login)
    
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    # All task routes will start with /api/tasks (e.g. /api/tasks/create)
    
    return app