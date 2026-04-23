from flask import Blueprint, jsonify
from backend.models import db, Client, Appointment, Finance
from datetime import datetime, date
from sqlalchemy import func, extract

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('', methods=['GET'])
def get_dashboard_stats():
    # Total Clients
    total_clients = Client.query.count()
    
    # Appointments Today
    today = date.today()
    appointments_today = Appointment.query.filter(Appointment.date == today).count()
    
    # Income/Expenses Month
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    # Incomes
    income_this_month = db.session.query(func.sum(Finance.amount)).filter(
        Finance.type == 'ingreso',
        extract('month', Finance.date) == current_month,
        extract('year', Finance.date) == current_year
    ).scalar() or 0
    
    # Expenses
    expenses_this_month = db.session.query(func.sum(Finance.amount)).filter(
        Finance.type == 'gasto',
        extract('month', Finance.date) == current_month,
        extract('year', Finance.date) == current_year
    ).scalar() or 0
    
    profit = income_this_month - expenses_this_month
    
    return jsonify({
        'total_clients': total_clients,
        'appointments_today': appointments_today,
        'income_this_month': float(income_this_month),
        'expenses_this_month': float(expenses_this_month),
        "profit": profit
    })
