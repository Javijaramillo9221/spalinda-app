import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
from routes import register_blueprints

# Absolute path to the frontend directory
basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
frontend_folder = os.path.join(basedir, 'frontend')

app = Flask(__name__, static_folder=frontend_folder, static_url_path='/')
app.config.from_object(Config)

# Enable CORS for all routes if testing locally via file:// or another port
CORS(app)

# Initialize Database
db.init_app(app)

# Register all API endpoints
register_blueprints(app)

# Create tables before first request, wait actually we can just do it in the app context directly
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return send_from_directory(frontend_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    # This acts as a fallback to serve any other static files (like styles.css, app.js)
    if os.path.exists(os.path.join(frontend_folder, path)):
        return send_from_directory(frontend_folder, path)
    else:
        return send_from_directory(frontend_folder, 'index.html')  # SPA fallback
    
from werkzeug.security import generate_password_hash, check_password_hash
from flask import request, jsonify

# 🔐 usuario fijo
USERNAME = "Mayer"
HASHED_PASSWORD = generate_password_hash("Lmhrs*2026")


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json

    if data.get('username') != USERNAME:
        return jsonify({'error': 'Usuario incorrecto'}), 401

    if not check_password_hash(HASHED_PASSWORD, data.get('password')):
        return jsonify({'error': 'Contraseña incorrecta'}), 401

    return jsonify({'token': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
