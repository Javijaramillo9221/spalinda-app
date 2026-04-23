from backend.routes.clients import clients_bp
from backend.routes.appointments import appointments_bp
from backend.routes.finances import finances_bp
from backend.routes.dashboard import dashboard_bp

def register_blueprints(app):
    app.register_blueprint(clients_bp, url_prefix='/api/clients')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(finances_bp, url_prefix='/api/finances')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
