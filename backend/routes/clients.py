from flask import Blueprint, request, jsonify
from models import db, Client

clients_bp = Blueprint('clients', __name__)

def formatear_telefono(numero):
    numero = ''.join(filter(str.isdigit, numero))  # solo números

    if len(numero) == 10:
        return "57" + numero

    if numero.startswith("57"):
        return numero

    return numero

@clients_bp.route('', methods=['GET'])
def get_clients():
    clients = Client.query.order_by(Client.id.desc()).all()
    return jsonify([client.to_dict() for client in clients])

@clients_bp.route('', methods=['POST'])
def create_client():
    data = request.json
    new_client = Client(
        name=data['name'],
        phone=formatear_telefono(data['phone']),
        pet_name=data['pet_name'],
        pet_type=data['pet_type'],
        pet_details=data.get('pet_details', '')
    )
    db.session.add(new_client)
    db.session.commit()
    return jsonify(new_client.to_dict()), 201

@clients_bp.route('/<int:id>', methods=['DELETE'])
def delete_client(id):
    client = Client.query.get_or_404(id)
    db.session.delete(client)
    db.session.commit()
    return jsonify({'message': 'Client deleted successfully'})
