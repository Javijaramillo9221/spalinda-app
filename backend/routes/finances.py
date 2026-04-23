from flask import Blueprint, request, jsonify
from backend.models import db, Finance
from datetime import datetime

finances_bp = Blueprint('finances', __name__)

@finances_bp.route('', methods=['GET'])
def get_finances():
    finances = Finance.query.order_by(Finance.date.desc(), Finance.id.desc()).all()
    return jsonify([f.to_dict() for f in finances])

@finances_bp.route('', methods=['POST'])
def create_finance():
    data = request.json
    try:
        date_obj = datetime.strptime(data.get('date', datetime.utcnow().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        
        new_finance = Finance(
            type=data['type'],
            amount=data['amount'],
            description=data['description'],
            date=date_obj
        )
        db.session.add(new_finance)
        db.session.commit()
        return jsonify(new_finance.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@finances_bp.route('/<int:id>', methods=['DELETE'])
def delete_finance(id):
    finance = Finance.query.get_or_404(id)
    db.session.delete(finance)
    db.session.commit()
    return jsonify({'message': 'Finance deleted successfully'})
